

module.exports = (RED) => {
    'use strict';

    const ENDPOINT = 'https://api.gyazo.com/api/images';

    const main = function(config){
        const node = this;
        RED.nodes.createNode(node, config);
    
        const GYAZO_TOKEN = node.credentials.GyazoAccessToken;
        console.log('Gyazo Access Token:', GYAZO_TOKEN);

        node.on('input', async (msg, send, done) => {
            const mes = msg.payload;
            try {
                // Gyazoの検索API
                const params = new URLSearchParams({
                    query: 'cat',
                    page: '1',
                    per: '10'
                });

                const res = await fetch(`${ENDPOINT}?${params}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${ GYAZO_TOKEN}`
                    }
                });

                // レスポンスをJSONとして解析
                const data = await res.json();
                // console.log(data);
                msg.payload = data;
                send(msg);
                done();
            } catch (error) {
                console.error(error);
                done(error);
            }

        });
    }

    RED.nodes.registerType("gyazo-get", main, {
        credentials: {
            GyazoAccessToken: {type:"password"}
        }
    });
}