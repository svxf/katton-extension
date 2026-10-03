const EVENTS = [
  ['player_join', 'a player entered the arena (game)'],
  ['player_quit', 'a player left the arena (game)'],
  ['player_death', 'a player died in the arena (game)'],
  ['player_respawn', 'a player respawned in the arena (game)'],
  ['player_interact', 'when a player interacting with something interactable like a chest'],
  ['player_leftclick', 'a left click interaction'],
  ['player_rightclick', 'a right click interaction'],
  ['block_break', 'a block was broken'],
  ['block_place', 'a block was placed'],
  ['entity_death', 'an entity (or player) died'],
  ['item_drop', 'a player dropped an item'],
  ['item_pickup', 'a player picked up an item'],
  ['player_interact_entity', 'a player right clicked an entity'],
  ['projectile_hit', 'a projectile shot from a player hits something'],
  ['player_shoot_bow', 'a player shoots a bow'],
];

const PERMISSIONS = [
  ['admin', 'only the current admin may run this command'],
  ['creative', 'only a player currently in creative mode may run this command'],
  ['all', 'any player in creative, spectator, survival, or adventure may run this command'],
];

const PROJECTILES = [
  'arrow', 'spectral_arrow', 'snowball', 'egg', 'ender_pearl', 'fireball',
  'ghast_fireball', 'small_fireball', 'dragon_fireball', 'wither_skull',
  'shulker_bullet', 'trident', 'experience_bottle',
];

const DURATION_UNITS = ['ticks', 'seconds', 'minutes'];

const EVENT_NAMES = EVENTS.map(([name]) => name);
const PERMISSION_NAMES = PERMISSIONS.map(([name]) => name);

module.exports = {
  EVENTS, PERMISSIONS, PROJECTILES, DURATION_UNITS, EVENT_NAMES, PERMISSION_NAMES,
};
