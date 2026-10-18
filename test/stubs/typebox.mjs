const schema = (kind) => (...args) => ({ kind, args });
export const Type = {
	Object: schema("Object"),
	String: schema("String"),
	Optional: schema("Optional"),
	Union: schema("Union"),
	Null: schema("Null"),
};
