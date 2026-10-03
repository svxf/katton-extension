const ADMIN_COMMANDS = [
  'border', 'bring', 'bringall', 'broadcast', 'cleareffects', 'countdown', 'stopcd', 'crafting', 'creative',
  'cylinder', 'day', 'deathmessages', 'difficulty', 'togglesuicide', 'chatcooldown', 'dropping', 'falldamage',
  'freeze', 'hardcore', 'hardcorebeds', 'heal', 'healall', 'hideplayers', 'viewplayers', 'highlight', 'hunger',
  'iframes', 'interacting', 'keepinv', 'kill', 'killall', 'killmobs', 'mobdamage', 'mobspawning', 'mutechat',
  'mutespectators', 'nametags', 'naturalregen', 'night', 'oldcombat', 'pickup', 'platform', 'pve', 'pvp',
  'random', 'randomitems', 'reducedf3', 'respawntimer', 'setskin', 'setspawnpoint', 'spectator', 'survival',
  'team', 'title', 'tnt', 'winblock', 'autopickup', 'adminlock', 'to', 'goto', 'poll', 'placing', 'breaking',
  'building', 'clearplayer', 'blockattributes', 'elytradamage', 'reminder', 'autosmelt', 'hidehates', 'cyl',
  '//pos1', '//pos2', '//set', '//undo', '//replace', '//center', '//walls',
];

const ADMIN_COMMAND_DOCS = ADMIN_COMMANDS.map(command => [
  command,
  `allowed command for Katton.makeAdminExecuteCommand("${command} ...")`,
]);

module.exports = { ADMIN_COMMANDS, ADMIN_COMMAND_DOCS };
