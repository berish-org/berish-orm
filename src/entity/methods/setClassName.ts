import type { Entity } from '../entity';

export function setClassName(entity: Entity, className: string): void {
  if (!entity) return null;
  entity.setSystem('className', className);
}
