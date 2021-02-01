import { getClassOfInstance } from '@berish/class';
import { Entity } from '../entity';

export function getClassName(entity: Entity): string {
  if (!entity) return null;
  const cls = getClassOfInstance<typeof Entity>(entity);
  return cls.className || entity.get('className');
}
