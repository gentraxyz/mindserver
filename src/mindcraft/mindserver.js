import { Server } from 'socket.io';
import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import * as mindserver from './mindcraft.js';
import { readFileSync } from 'fs';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Mindserver is:
// - central hub for communication between all agent processes
// - api to control from other languages and remote users 
// - host for webapp

let io;
let server;
const agent_connections = {};
const agent_listeners = [];

const settings_spec = JSON.parse(readFileSync(path.join(__dirname, 'public/settings_spec.json'), 'utf8'));

class AgentConnection {
    constructor(settings, viewer_port) {
        this.socket = null;
        this.settings = settings;
        this.in_game = false;
        this.full_state = null;
        this.viewer_port = viewer_port;
    }
    setSettings(settings) {
        this.settings = settings;
    }
}

export function registerAgent(settings, viewer_port) {
    let agentConnection = new AgentConnection(settings, viewer_port);
    agent_connections[settings.profile.name] = agentConnection;
}

export function logoutAgent(agentName) {
    if (agent_connections[agentName]) {
        agent_connections[agentName].in_game = false;
        agentsStatusUpdate();
    }
}

// Initialize the server
export function createMindServer(host_public = false, port = 8080) {
    const app = express();
    server = http.createServer(app);
    io = new Server(server);

    // Serve static files
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    app.use(express.static(path.join(__dirname, 'public')));

    // Socket.io connection handling
    io.on('connection', (socket) => {
        let curAgentName = null;
        console.log('Client connected');

        agentsStatusUpdate(socket);

        socket.on('create-agent', async (settings, callback) => {
            console.log('API create agent...');
            for (let key in settings_spec) {
                if (!(key in settings)) {
                    if (settings_spec[key].required) {
                        callback({ success: false, error: `Setting ${key} is required` });
                        return;
                    }
                    else {
                        settings[key] = settings_spec[key].default;
                    }
                }
            }
            for (let key in settings) {
                if (!(key in settings_spec)) {
                    delete settings[key];
                }
            }
            if (settings.profile?.name) {
                if (settings.profile.name in agent_connections) {
                    callback({ success: false, error: 'Agent already exists' });
                    return;
                }
                let returned = await mindserver.createAgent(settings);
                callback({ success: returned.success, error: returned.error });
                let name = settings.profile.name;
                if (!returned.success && agent_connections[name]) {
                    mindserver.destroyAgent(name);
                    delete agent_connections[name];
                }
                agentsStatusUpdate();
            }
            else {
                console.error('Agent name is required in profile');
                callback({ success: false, error: 'Agent name is required in profile' });
            }
        });

        socket.on('complete-onboarding', async (onboardingSettings, callback) => {
            console.log('Completing onboarding with settings:', onboardingSettings);
            console.log('DEBUG: Model field in onboarding:', onboardingSettings.model);

            try {
                // Get default settings from global (set in main.js)
                const defaultSettings = global.defaultSettings || {};

                // Fetch settings spec
                const settingsSpec = settings_spec;

                // Build complete settings object starting with defaults
                const settings = {};
                Object.keys(settingsSpec).forEach(key => {
                    if (key !== 'profile') {
                        settings[key] = defaultSettings[key] !== undefined
                            ? defaultSettings[key]
                            : settingsSpec[key].default;
                    }
                });

                // Load base profile defaults (modes, prompts, etc.)
                const baseProfileName = onboardingSettings.base_profile || 'assistant';
                const baseProfilePath = path.join(__dirname, '..', '..', 'profiles', 'defaults', `${baseProfileName}.json`);
                let baseProfile = {};
                try {
                    baseProfile = JSON.parse(readFileSync(baseProfilePath, 'utf8'));
                } catch (err) {
                    console.warn(`Could not load base profile ${baseProfileName}:`, err.message);
                }

                // Build model configuration from selected model
                let modelConfig = {};
                if (onboardingSettings.model) {
                    modelConfig.model = onboardingSettings.model;
                    console.log(`DEBUG: Using selected model: ${onboardingSettings.model}`);
                } else {
                    // Fallback to first configured profile if model not selected
                    if (defaultSettings.profiles && defaultSettings.profiles.length > 0) {
                        try {
                            const profilePath = defaultSettings.profiles[0];
                            const modelProfile = JSON.parse(readFileSync(profilePath, 'utf8'));
                            modelConfig = modelProfile;
                            console.log(`Loaded model configuration from ${profilePath}`);
                        } catch (err) {
                            console.warn(`Could not load profile from ${defaultSettings.profiles[0]}:`, err.message);
                        }
                    }
                }

                // Apply onboarding customizations
                settings.profile = {
                    ...modelConfig,   // Get model configuration from selected model or first profile
                    ...baseProfile,   // Merge base profile properties (modes, prompts, etc.)
                    name: onboardingSettings.name  // Override name with onboarding selection
                };
                settings.base_profile = baseProfileName;
                settings.allow_insecure_coding = onboardingSettings.allow_insecure_coding || false;
                settings.allow_vision = onboardingSettings.allow_vision || false;
                settings.render_bot_view = onboardingSettings.render_bot_view || false;

                if (onboardingSettings.port !== undefined) {
                    settings.port = parseInt(onboardingSettings.port);
                }

                // Handle Worker API Key
                if (onboardingSettings.worker_api_key) {
                    settings.worker_api_key = onboardingSettings.worker_api_key;
                    // Also propagate to process env logic if needed, but mainly it stays in settings for the model to pick up
                    console.log('DEBUG: Set worker_api_key from onboarding');
                }

                console.log(`Profile for ${settings.profile.name}:`, settings.profile);

                // Check if agent already exists
                if (settings.profile.name in agent_connections) {
                    callback({ success: false, error: 'Agent already exists' });
                    return;
                }

                // Create the agent
                let returned = await mindserver.createAgent(settings);

                if (returned.success) {
                    console.log(`Agent ${settings.profile.name} created successfully via onboarding`);
                    callback({ success: true });
                } else {
                    console.error(`Failed to create agent: ${returned.error}`);
                    callback({ success: false, error: returned.error });

                    // Cleanup if creation failed
                    let name = settings.profile.name;
                    if (agent_connections[name]) {
                        mindserver.destroyAgent(name);
                        delete agent_connections[name];
                    }
                }

                agentsStatusUpdate();
            } catch (error) {
                console.error('Error in onboarding:', error);
                callback({ success: false, error: error.message || 'Unknown error occurred' });
            }
        });

        socket.on('get-settings', (agentName, callback) => {
            if (agent_connections[agentName]) {
                callback({ settings: agent_connections[agentName].settings });
            } else {
                callback({ error: `Agent '${agentName}' not found.` });
            }
        });

        socket.on('connect-agent-process', (agentName) => {
            if (agent_connections[agentName]) {
                agent_connections[agentName].socket = socket;
                agentsStatusUpdate();
            }
        });

        socket.on('login-agent', (agentName) => {
            if (agent_connections[agentName]) {
                agent_connections[agentName].socket = socket;
                agent_connections[agentName].in_game = true;
                curAgentName = agentName;
                agentsStatusUpdate();
            }
            else {
                console.warn(`Unregistered agent ${agentName} tried to login`);
            }
        });

        socket.on('disconnect', () => {
            if (agent_connections[curAgentName]) {
                console.log(`Agent ${curAgentName} disconnected`);
                agent_connections[curAgentName].in_game = false;
                agent_connections[curAgentName].socket = null;
                agentsStatusUpdate();
            }
            if (agent_listeners.includes(socket)) {
                removeListener(socket);
            }
        });

        socket.on('chat-message', (agentName, json) => {
            if (!agent_connections[agentName]) {
                console.warn(`Agent ${agentName} tried to send a message but is not logged in`);
                return;
            }
            console.log(`${curAgentName} sending message to ${agentName}: ${json.message}`);
            agent_connections[agentName].socket.emit('chat-message', curAgentName, json);
        });

        socket.on('set-agent-settings', (agentName, settings) => {
            const agent = agent_connections[agentName];
            if (agent) {
                agent.setSettings(settings);
                agent.socket.emit('restart-agent');
            }
        });

        socket.on('restart-agent', (agentName) => {
            console.log(`Restarting agent: ${agentName}`);
            agent_connections[agentName].socket.emit('restart-agent');
        });

        socket.on('stop-agent', (agentName) => {
            mindserver.stopAgent(agentName);
        });

        socket.on('start-agent', (agentName) => {
            mindserver.startAgent(agentName);
        });

        socket.on('destroy-agent', (agentName) => {
            if (agent_connections[agentName]) {
                mindserver.destroyAgent(agentName);
                delete agent_connections[agentName];
            }
            agentsStatusUpdate();
        });

        socket.on('stop-all-agents', () => {
            console.log('Killing all agents');
            for (let agentName in agent_connections) {
                mindserver.stopAgent(agentName);
            }
        });

        socket.on('shutdown', () => {
            console.log('Shutting down');
            for (let agentName in agent_connections) {
                mindserver.stopAgent(agentName);
            }
            // wait 2 seconds
            setTimeout(() => {
                console.log('Exiting MindServer');
                process.exit(0);
            }, 2000);

        });

        socket.on('send-message', (agentName, data) => {
            if (!agent_connections[agentName]) {
                console.warn(`Agent ${agentName} not in game, cannot send message via MindServer.`);
                return
            }
            try {
                agent_connections[agentName].socket.emit('send-message', data)
            } catch (error) {
                console.error('Error: ', error);
            }
        });

        socket.on('bot-output', (agentName, message) => {
            io.emit('bot-output', agentName, message);
        });

        socket.on('listen-to-agents', () => {
            addListener(socket);
        });
    });

    let host = host_public ? '0.0.0.0' : '127.0.0.1';
    server.listen(port, host, () => {
        console.log(`MindServer running on port ${port}`);
    });

    return server;
}

function agentsStatusUpdate(socket) {
    if (!socket) {
        socket = io;
    }
    let agents = [];
    for (let agentName in agent_connections) {
        const conn = agent_connections[agentName];
        agents.push({
            name: agentName,
            in_game: conn.in_game,
            viewerPort: conn.viewer_port,
            socket_connected: !!conn.socket
        });
    };
    socket.emit('agents-status', agents);
}


let listenerInterval = null;
function addListener(listener_socket) {
    agent_listeners.push(listener_socket);
    if (agent_listeners.length === 1) {
        listenerInterval = setInterval(async () => {
            const states = {};
            for (let agentName in agent_connections) {
                let agent = agent_connections[agentName];
                if (agent.in_game) {
                    try {
                        const state = await new Promise((resolve) => {
                            agent.socket.emit('get-full-state', (s) => resolve(s));
                        });
                        states[agentName] = state;
                    } catch (e) {
                        states[agentName] = { error: String(e) };
                    }
                }
            }
            for (let listener of agent_listeners) {
                listener.emit('state-update', states);
            }
        }, 1000);
    }
}

function removeListener(listener_socket) {
    agent_listeners.splice(agent_listeners.indexOf(listener_socket), 1);
    if (agent_listeners.length === 0) {
        clearInterval(listenerInterval);
        listenerInterval = null;
    }
}

// Optional: export these if you need access to them from other files
export const getIO = () => io;
export const getServer = () => server;
export const numStateListeners = () => agent_listeners.length;