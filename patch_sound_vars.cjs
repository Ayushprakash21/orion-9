const fs = require('fs');

function removeLines(file, regexes) {
    if(!fs.existsSync(file)) return;
    let code = fs.readFileSync(file, 'utf8');
    for(const r of regexes) {
        code = code.replace(r, '');
    }
    fs.writeFileSync(file, code);
}

removeLines('src/os/WindowManagerContext.tsx', [
    /const \{ soundEffects, masterVolume \} = supplyChain\?\.settings \|\| \{\};\n?/g,
    /, soundEffects, masterVolume/g,
    /\[soundEffects, masterVolume\]/g
]);

removeLines('src/os/components/OrionPowerOnScreen.tsx', [
    /const \{ soundEffects, masterVolume \} = supplyChain\?\.settings \|\| \{\};\n?/g
]);

removeLines('src/os/components/OrionShutdownScreen.tsx', [
    /const \{ soundEffects, masterVolume \} = supplyChain\?\.settings \|\| \{\};\n?/g
]);

removeLines('src/store/ToastContext.tsx', [
    /const \{ soundEffects, masterVolume \} = supplyChain\?\.settings \|\| \{\};\n?/g,
    /\s*if \(soundEffects\) \{\n?\s*\}\n?/g,
    /, soundEffects, masterVolume/g,
    /\[soundEffects, masterVolume\]/g
]);

