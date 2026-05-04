// Represents a phase or stage of the game such as
// menus, game, editor, etc. 
export abstract class Stage {
	// Editor, Game, Menu, etc. Used for identification
	// and switching to.
	abstract name(): string;

	// Setup function for our stage.
	abstract on_start(): void;

	// Breakdown function, if needed.
	abstract on_end(): void;
}