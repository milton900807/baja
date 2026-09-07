
import { Pipe, PipeTransform } from '@angular/core';


@Pipe({ name: 'filenameFilter' })
export class FilenameFilter implements PipeTransform {



    filterFilesByExtensionAndFolder(fileElements: FileElement[], extensionString: string): FileElement[] {
        const extensions = extensionString
            .split(',')
            .map(ext => {
                const trimmed = ext.trim();
                const withDot = trimmed.startsWith('.') ? trimmed : '.' + trimmed;
                // Lower-cased on both sides below. Every other branch of transform()
                // compares with toLowerCase(), so a single-extension filter listed
                // SCREEN.BAJA and a comma-separated one silently did not -- the same
                // filter string behaving differently depending on how many extensions
                // were in it.
                return withDot.replace(/^\.+/, '').toLowerCase(); // Remove all leading '.' characters
            });
        // const extensions = extensionString.split(',').map(ext => ext.startsWith('.') ? ext : '.' + ext.trim()); // Ensure each extension starts with '.'
        return fileElements.filter(fileElement => {
            if (fileElement.isFolder) return true; // Automatically include folders
            const extension = (fileElement.name.split('.').pop() || '').toLowerCase(); // Extract the extension from the file name
            return extensions.includes(extension);
        });
    }
    transform(all: FileElement[], filterArgs: string, fileType: string) {
        if (all === null || all.length <= 0) {
            return null;
        }
        if (fileType != null && fileType == '*') {
            fileType = null;
        }
        if (filterArgs.startsWith(':')) {
            return all;
        }

        if (fileType != null && fileType.length > 0 && fileType.indexOf(',') > 0) {
            return this.filterFilesByExtensionAndFolder(all, fileType)
        }




        if (filterArgs != null && filterArgs.length > 0 && fileType != null && fileType.length > 1) {
            return all.filter(f => (f.name != null && f.name.toLowerCase().indexOf(filterArgs.toLowerCase()) >= 0
                && (f.isFolder || f.name.toLowerCase().endsWith(fileType.toLowerCase()))))
        }
        else if (filterArgs != null && filterArgs.length > 0) {
            if (fileType != null && fileType.length > 0)
                return all.filter(f => (f != null && f.name != null && (f.isFolder || f.name.toLowerCase().endsWith(fileType.toLowerCase()))))
            else
                return all.filter(f => (f.name != null && f.name.toLowerCase().indexOf(filterArgs.toLowerCase()) >= 0))
        }
        if (fileType != null && fileType.length > 0)
            return all.filter(f => (f != null && f.name != null && (f.isFolder || f.name.toLowerCase().endsWith(fileType.toLowerCase()))))
        else
            return all.filter(f => (f != null && f.name != null))

    }
}

class FileElement {
    name = '';
    folder;
    isFolder: string;
}
