module.exports = function(RED) {
    'use strict';

    function GyazoGetImageNode(config) {
        const node = this;
        RED.nodes.createNode(node, config);

        const configNode = RED.nodes.getNode(config.config);

        node.on('input', async (msg, send, done) => {
            if (!configNode || !configNode.accessToken) {
                node.error("Gyazo Access Token is missing.");
                done();
                return;
            }

            const GYAZO_TOKEN = configNode.accessToken;
            const image_id = msg.payload?.image_id;

            if (!image_id) {
                node.error("image_id is required in msg.payload.image_id");
                done();
                return;
            }

            const ENDPOINT = `https://api.gyazo.com/api/images/${image_id}`;

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);

            try {
                const params = new URLSearchParams({
                    access_token: GYAZO_TOKEN
                });

                const res = await fetch(`${ENDPOINT}?${params}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${GYAZO_TOKEN}`,
                        'Accept': 'application/json'
                    },
                    signal: controller.signal
                });

                if (!res.ok) {
                    const errorBody = await res.text();
                    throw new Error(`HTTP ${res.status}: ${errorBody}`);
                }

                const data = await res.json();
                msg.payload = data;
                send(msg);
                done();
            } catch (error) {
                if (error.name === 'AbortError') {
                    node.error("Request timeout", msg);
                } else {
                    node.error(`Fetch failed: ${error.message}`, msg);
                }
                done(error);
            } finally {
                clearTimeout(timeout);
            }
        });
    }
    RED.nodes.registerType("gyazo-get-image", GyazoGetImageNode);
}
