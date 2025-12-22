module.exports = function(RED) {
    function GyazoConfigNode(n) {
        RED.nodes.createNode(this, n);
        this.accessToken = this.credentials.accessToken;
    }
    RED.nodes.registerType("gyazo-config", GyazoConfigNode, {
        credentials: {
            accessToken: { type: "password" }
        }
    });
}