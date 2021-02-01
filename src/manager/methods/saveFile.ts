import { IBaseFileItem } from '../../baseFileAdapter';
import { FileEntity } from '../../entity';
import { serberFileEntityToDB } from '../../serber';
import { Manager } from '../manager';

export async function saveFile(manager: Manager, files: FileEntity | FileEntity[]): Promise<void> {
  const arr = Array.isArray(files) ? files : [files];
  if (arr.some((m) => !(m instanceof FileEntity))) throw new Error('ORM: argument to saveFile is not FileEntity');
  const serialized: IBaseFileItem[] = serberFileEntityToDB.serialize(arr);
  await manager.file.create(serialized);
}
