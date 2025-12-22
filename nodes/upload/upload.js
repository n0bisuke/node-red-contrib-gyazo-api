module.exports = function(RED) {
    'use strict';

    function GyazoUploadNode(config) {
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
            const UPLOAD_ENDPOINT = 'https://upload.gyazo.com/api/upload';

            // payloadがBufferかどうかチェック
            if (!Buffer.isBuffer(msg.payload)) {
                node.error("Payload must be a Buffer (image data).");
                done();
                return;
            }

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 15000); // アップロードは少し長めに

            try {
                // FormDataの作成
                const formData = new FormData();
                // 第2引数のBlob変換（Node.jsのfetchで扱うため）
                const blob = new Blob([msg.payload]);
                formData.append('access_token', GYAZO_TOKEN);
                formData.append('imagedata', blob, 'upload.png');

                const res = await fetch(UPLOAD_ENDPOINT, {
                    method: 'POST',
                    body: formData,
                    signal: controller.signal
                });

                if (!res.ok) {
                    const errorText = await res.text();
                    throw new Error(`Upload Failed ${res.status}: ${errorText}`);
                }

                const data = await res.json();
                msg.payload = data; // アップロード後の画像URLなどの情報が返る
                send(msg);
                done();
            } catch (error) {
                if (error.name === 'AbortError') {
                    node.error("Upload timeout", msg);
                } else {
                    node.error(`Upload failed: ${error.message}`, msg);
                }
                done(error);
            } finally {
                clearTimeout(timeout);
            }
        });
    }
    RED.nodes.registerType("gyazo-upload", GyazoUploadNode);
}