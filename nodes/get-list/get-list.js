module.exports = function(RED) {
    'use strict';
    // 安定性のために global fetch を使用 (Node.js v18+)
    // もし古いNode.jsなら 'node-fetch' 等が必要ですが、エラー内容から標準fetchと推測します

    function GyazoGetListNode(config) {
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
            const ENDPOINT = 'https://api.gyazo.com/api/images';

            // 1. タイムアウト処理の追加 (5秒でタイムアウト)
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);

            try {
                // API仕様に基づいたパラメータ (page, per_page)
                const page = msg.payload?.page || 1;
                const per_page = msg.payload?.per_page || 20;

                const params = new URLSearchParams({
                    access_token: GYAZO_TOKEN,
                    page: String(page),
                    per_page: String(per_page)
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
                    // 429 Too Many Requests などのエラーを具体的に出す
                    const errorBody = await res.text();
                    throw new Error(`HTTP ${res.status}: ${errorBody}`);
                }

                const data = await res.json();
                msg.payload = data;
                send(msg);
                done();
            } catch (error) {
                // 2. エラーの詳細ログ出力
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
    RED.nodes.registerType("gyazo-get-list", GyazoGetListNode);
}