import { FileEntity } from '../../entity';
import { serberFileEntityToDB, SYMBOL_SERBER_FILES } from '../../serber';
import { Manager } from '../manager';

export async function getFile(
  manager: Manager,
  arr: (string | FileEntity)[],
  fetchData?: boolean,
): Promise<FileEntity[]> {
  if (arr.some((m) => !(m instanceof FileEntity) && typeof m !== 'string'))
    throw new Error('ORM: argument to removeFile is not FileEntity or string');
  const files = arr.map((m) => {
    if (m instanceof FileEntity) return m;
    const fileEntity = new FileEntity();

    fileEntity.attributes.id = m;

    return fileEntity;
  });
  const items = await manager.file.get(
    files.map((m) => m.id),
    fetchData,
  );
  const deserialized: FileEntity[] = serberFileEntityToDB.deserialize(items, { [SYMBOL_SERBER_FILES]: files });
  return deserialized;
}
