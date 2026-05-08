module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        console.log(`✅ ${client.user.tag} online hai!`);
        client.user.setActivity('DenClient Server', { type: 3 });
    }
};