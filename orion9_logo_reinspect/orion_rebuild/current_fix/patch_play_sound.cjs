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
    /import \{ playSound \} from '.\/audio';\n?/g,
    /if \(soundEffects\) playSound\('click', masterVolume\);\n?/g
]);

removeLines('src/os/components/OrionPowerOnScreen.tsx', [
    /import \{ playSound \} from '\.\.\/audio';\n?/g,
    /if \(soundEffects\) playSound\('boot', masterVolume\); /g
]);

removeLines('src/os/components/OrionShutdownScreen.tsx', [
    /import \{ playSound \} from '\.\.\/audio';\n?/g,
    /if \(soundEffects\) playSound\('error', masterVolume\);\n?/g
]);

removeLines('src/store/ToastContext.tsx', [
    /import \{ playSound \} from '\.\.\/os\/audio';\n?/g,
    /if \(type === 'error'\) playSound\('error', masterVolume\);\n?\s*else if \(type === 'success'\) playSound\('success', masterVolume\);\n?\s*else playSound\('notification', masterVolume\);\n?/g
]);

