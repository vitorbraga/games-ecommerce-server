import * as fs from 'fs';
import * as path from 'path';

export function removePicture(fileName: string) {
    const filePath = path.join(__dirname, '..', '..', 'public', 'product-pictures', fileName);
    fs.unlinkSync(filePath);
}
