import roleData from './synthetic-roles-v9.json';

export type SyntheticRoleV9 = (typeof roleData.roles)[number];

export const syntheticRolesV9 = roleData.roles;
export const syntheticRolesV9BySlug = new Map(syntheticRolesV9.map(role => [role.slug, role]));
export const syntheticRoleV9Counts = roleData.counts;

export const syntheticRolesV9ByComponent = new Map<string, SyntheticRoleV9[]>();
for (const role of syntheticRolesV9) {
	for (const component of role.components) {
		const roles = syntheticRolesV9ByComponent.get(component.ssoc2024) ?? [];
		roles.push(role);
		syntheticRolesV9ByComponent.set(component.ssoc2024, roles);
	}
}
