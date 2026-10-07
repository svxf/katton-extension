const STATE_MEMBERS = [
  ['get(name)', 'reads a stored variable, or null if unset'],
  ['set(name, value)', 'stores a variable (string, number, boolean, list, or map)'],
  ['increment(name, by = 1)', 'increments a variable and returns the new value'],
  ['decrement(name, by = 1)', 'decrements a variable and returns the new value'],
];

const API_TYPES = [
  {
    type: 'Katton',
    group: 'engine',
    prefix: 'Katton.',
    members: [
      ['players', 'a player selector object: see the wiki for all()/survival()/spectator()/creative()'],
      ['vars', 'the state storage object: see the wiki for get/set/increment/decrement'],
      ['log', 'the owner only logging object: see the wiki for info/warn/error'],
      ['item(material)', 'creates an item from a case insensitive vanilla paper material name', 'item("${1:stick}")'],
      ['pick(list)', 'returns one random element from a list, or null if empty'],
      ['pickMany(list, count)', 'returns up to <count> unique random elements from a list', 'pickMany(${1:list}, ${2:3})'],
      ['after(5.seconds) { ... }', 'runs a block once after a delay', 'after(${1:5}.${2|seconds,ticks,minutes|}) {\n\t$3\n}'],
      ['every(20.ticks) { ... }', 'runs a block on a repeating interval', 'every(${1:20}.${2|ticks,seconds,minutes|}) {\n\t$3\n}'],
      ['cancel(taskId)', 'cancels a task started with after/every'],
      ['makeAdminExecuteCommand(command)', 'makes you run a command', 'makeAdminExecuteCommand("$1")'],
    ],
  },

  {
    type: 'player',
    group: 'player object',
    prefix: 'player.',
    members: [
      // properties
      ['name', "the player's username"],
      ['uuid', "the player's UUID as a string"],
      ['world', 'the name of the world the player is in'],
      ['location', 'a location value: { x, y, z, yaw, pitch }'],
      ['health', "the player's current health"],
      ['game_mode', 'one of "survival", "creative", "adventure", "spectator"'],
      ['is_sneaking', 'true if the player is currently sneaking'],
      ['is_sprinting', 'true if the player is currently sprinting'],
      ['facing', 'direction the player is looking: 1=down 2=up 3=north 4=south 5=west 6=east. up/down only when looking mostly straight up or down, otherwise the cardinal direction they mostly face'],
      ['tool', "an item value for whatever's in their main hand (an empty hand is an item value of air)"],
      ['offhand_tool', 'same as tool, but their off hand'],

      // methods
      ['sendMessage(text)', 'sends a chat message, supports & color codes'],
      ['sendTitle(title, subtitle = "")', 'shows a title and subtitle, supports & color codes'],
      ['sendActionBar(text)', 'shows text on the actionbar, supports & color codes'],
      ['teleport(location)', 'teleports the player to a location value'],
      ['give(item)', 'adds a Katton.item(...) value to the inventory'],
      ['playSound(sound, volume = 1, pitch = 1)', 'plays a sound to just this player'],
      ['launchForward(horizontal, vertical)', 'launches the player in the direction they are facing. horizontal is forward speed, vertical is upward speed. max value is 6'],
      ['shootProjectile(projectile, speed)', 'shoots a projectile in the direction the player is facing. allowed: arrow, spectral_arrow, snowball, egg, ender_pearl, fireball, ghast_fireball, small_fireball, dragon_fireball, wither_skull, shulker_bullet, trident, experience_bottle. max speed is 6', 'shootProjectile("$1", ${2:2})'],
      ['setTool(item)', "replaces whatever's in their main hand (doesn't add to the inventory like give does)"],
      ['setOffhandTool(item)', "replaces whatever's in their off hand"],
      ['clearInventory()', 'wipes their entire inventory, including armor and both hands'],
      ['setGlowing(glowing = true)', 'turns the glowing outline on or off'],
      ['setMovementSpeed(speed)', 'sets movement speed (vanilla default is 0.1)'],
      ['resetMovementSpeed()', 'resets movement speed back to 0.1'],
      ['setJumpStrength(strength)', 'sets jump strength (vanilla default is 0.42)'],
      ['resetJumpStrength()', 'resets jump strength back to 0.42'],
      ['setInvulnerable(invulnerable = true)', 'true makes the player immune to all damage'],
    ],
  },

  {
    type: 'entity',
    group: 'entity object',
    prefix: 'entity.',
    members: [
      // properties
      ['uuid', "the entity's UUID as a string"],
      ['type', 'the entity type, e.g. "zombie"'],
      ['is_valid', 'false once the entity died or despawned. check this before using a stored entity, every other property and method throws a runtime error on an invalid entity'],
      ['location', 'a location value: { x, y, z, yaw, pitch }'],
      ['health', 'current health (living entities only)'],
      ['max_health', 'maximum health (living entities only)'],
      ['tags', 'a list of scoreboard tag strings'],
      ['yaw', 'horizontal rotation (living entities only)'],
      ['pitch', 'vertical rotation (living entities only)'],

      // methods
      ['setHealth(health)', "sets health, clamped between 0 and the entity's max_health (living entities only)"],
      ['setDisplayName(text)', 'sets the name tag, supports & color codes. "" hides it again'],
      ['teleport(location)', 'teleports the entity to a location value'],
      ['setGlowing(glowing = true)', 'turns the glowing outline on or off'],
      ['addTag(tag)', 'adds a scoreboard tag, handy for marking entities your script spawned'],
      ['removeTag(tag)', 'removes a scoreboard tag, does nothing if it was never there'],
      ['hasTag(tag)', 'true if the entity has the scoreboard tag'],
      ['setMovementSpeed(speed)', 'sets movement speed (vanilla default is 0.1, living entities only)'],
      ['setJumpStrength(strength)', 'sets jump strength (vanilla default is 0.42, living entities only)'],
      ['setItem(item)', 'sets the item shown by an item display entity (runtime error on anything else)'],
      ['setBlock(material)', 'sets the block shown by a block display entity (runtime error on anything else)'],
      ['setOffset(x,y,z)', 'sets the display entity\'s offset'],
      ['setScale(x,y,z)', 'sets the display entity\'s scale'],
      ['setRotation(yaw,pitch,roll)', 'sets the display entity\'s rotation'],
      ['setTeleportDuration(ticks)', 'smoothly interpolates position changes over this many ticks instead of snapping. display entities only, clamped between 0 and 59'],
      ['kill()', 'removes the entity immediately'],
    ],
  },

  {
    type: 'world',
    group: 'world object',
    prefix: 'world.',
    members: [
      ['players', 'a list of player values in the game'],
      ['entities', 'a list of entity values in the world (players are NOT included, use world.players for those)'],
      ['spawnEntity(type, location)', 'spawns an entity (case insensitive type name) and returns it as an entity value. capped at 500 entities in the world at once, past that is a runtime error', 'spawnEntity("${1:zombie}", ${2:location})'],
      ['setBlock(location, material)', 'sets the block at a location. material is a case insensitive vanilla block material name (non-block materials are a runtime error)', 'setBlock(${1:location}, "${2:stone}")'],
      ['getBlock(location)', 'returns the block material name at a location, e.g. "glass"'],
      ['fillBlocks(from, to, material)', 'fills every block in the box between from and to. capped at 4096 blocks per call, going over is a runtime error, so split big fills into chunks', 'fillBlocks(${1:from}, ${2:to}, "${3:stone}")'],
      ['playSound(sound, location, volume = 1, pitch = 1)', 'plays a sound at a fixed location that everyone can hear (player.playSound plays to one player)', 'playSound("${1:entity_wither_spawn}", ${2:location})'],
    ],
  },

  {
    type: 'item',
    group: 'item object',
    prefix: 'item.',
    members: [
      ['name', 'returns the item display name'],
      ['type', "returns the item's type"],
      ['setName(text)', "sets the item's display name"],
      ['setLore(lines)', "sets the item's lore lines (a list of strings)", 'setLore([$1])'],
      ['setTag(key, value)', 'stores a tag on the item'],
      ['getTag(key)', 'reads a tag previously set with setTag'],
      ['enchant(name, level)', 'adds a vanilla enchantment by name and level', 'enchant("${1:sharpness}", ${2:1})'],
      ['clone()', 'returns a copy of the item'],
    ],
  },

  {
    type: 'event',
    group: 'event object',
    prefix: 'event.',
    members: [
      ['player', 'the player involved in this event, where applicable'],
      ['item', 'the item involved in this event, where applicable'],
      ['block', 'the block involved in this event, where applicable'],
      ['entity', 'the entity involved in this event, where applicable'],
      ['projectile', 'the projectile involved in this event, where applicable'],
      ['action', 'gets the type of action involved in this event, where applicable'],
      ['forward', 'checks if the forward key is being pressed, where applicable'],
      ['backward', 'checks if the forward key is being pressed, where applicable'],
      ['left', 'checks if the forward key is being pressed, where applicable'],
      ['right', 'checks if the forward key is being pressed, where applicable'],
      ['jump', 'checks if the forward key is being pressed, where applicable'],
      ['sneak', 'checks if the forward key is being pressed, where applicable'],
      ['sprint', 'checks if the forward key is being pressed, where applicable'],
      ['cancel()', 'cancels the underlying action, only where the event supports cancellation'],
      ['cleardrops()', 'clears the drops of the entity when they die, only where the event supports clearing drops'],
    ],
  },

  {
    type: 'Katton.players',
    group: 'Katton.players selectors',
    prefix: 'Katton.players.',
    members: [
      ['all()', 'every player in the game'],
      ['survival()', 'players in the game currently in survival/adventure mode'],
      ['spectator()', 'players in the game currently in spectator mode'],
      ['creative()', 'players in the game currently in creative mode'],
    ],
  },

  {
    type: 'Katton.vars',
    group: 'Katton.vars state',
    prefix: 'Katton.vars.',
    members: [
      ['script', 'state shared across the whole script'],
      ['player(uuid)', 'state stored for one player, by uuid'],
    ],
  },

  // `Katton.vars.script` and `Katton.vars.player(uuid)` expose same methods
  { type: 'Katton.vars.script', group: 'Katton.vars state', prefix: '....', wikiOnly: true, members: STATE_MEMBERS },
  { type: 'Katton.vars.player', group: null, prefix: '....', members: STATE_MEMBERS },

  {
    type: 'Katton.log',
    group: 'Katton.log owner logging',
    prefix: 'Katton.log.',
    members: [
      ['info(message)', 'sends a chat message to you only'],
      ['warn(message)', 'sends a warning colored chat message to you only'],
      ['error(message)', 'sends an error colored chat message to you only'],
    ],
  },

  {
    type: 'Math',
    group: 'Math helpers',
    prefix: 'Math.',
    members: [
      ['abs(number)', 'absolute value'],
      ['min(a, b)', 'the smaller of two numbers'],
      ['max(a, b)', 'the larger of two numbers'],
      ['clamp(value, minimum, maximum)', 'restricts value to the given range'],
      ['floor(number)', 'rounds down'],
      ['ceil(number)', 'rounds up'],
      ['round(number)', 'rounds to the nearest integer'],
      ['randomInt(minimum, maximum)', 'a random whole number, inclusive on both ends'],
      ['randomDecimal(minimum, maximum)', 'a random decimal number in the given range'],
    ],
  },
];

const MEMBER_RESULT_TYPES = {
  'event.player': 'player',
  'event.item': 'item',
  'event.entity': 'entity',
  'player.tool': 'item',
  'player.offhand_tool': 'item',
  'world.players': 'player[]',
  'world.entities': 'entity[]',
  'world.spawnEntity': 'entity',
  'item.clone': 'item',
  'Katton.item': 'item',
  'Katton.players.all': 'player[]',
  'Katton.players.survival': 'player[]',
  'Katton.players.spectator': 'player[]',
  'Katton.players.creative': 'player[]',
};

module.exports = { API_TYPES, MEMBER_RESULT_TYPES };
