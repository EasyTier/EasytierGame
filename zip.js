/**
 * 生成 release 发布包 zip 文件
 */
const pkg = require("./package.json");
const isWin7 = process.argv[2] == 'win7';
const releaseDir = isWin7 ? "./src-tauri/target/x86_64-win7-windows-msvc/release" : "./src-tauri/target/release";
const fileName = isWin7 ?  `easytier-game_windows7_fix_${pkg.version}.zip` : `easytier-game_windows_x86_64_${pkg.version}.zip`; // 发布包格式
const releaseDirEasytier = `${releaseDir}/easytier/`;
const releaseExe = `${releaseDir}/easytier-game.exe`;
const releaseHelp = `${releaseDir}/帮助.txt`;
const releaseUninstall = `${releaseDir}/uninstall.exe`;
const deleteEasytierFiles = ["logs/", "guiLogs/", "cache/"];
const releaseZipDir = "./release";
const releaseZip = `${releaseZipDir}/${fileName}`;

const fs = require("fs");
const path = require("path");
const archiver = require("archiver");

const output = fs.createWriteStream(path.join(__dirname, releaseZip));
const archive = archiver("zip", {
	zlib: { level: 8 } // Sets the compression level.
});

// listen for all archive data to be written
// 'close' event is fired only when a file descriptor is involved
output.on("close", function () {
	console.log(archive.pointer() + " total bytes");
	console.log(`archiver has been finalized and the output ${releaseZip}`);
});

// This event is fired when the data source is drained no matter what was the data source.
// It is not part of this library but rather from the NodeJS Stream API.
// @see: https://nodejs.org/api/stream.html#stream_event_end
output.on("end", function () {
	console.log("Data has been drained");
});

// good practice to catch warnings (ie stat failures and other non-blocking errors)
archive.on("warning", function (err) {
	if (err.code === "ENOENT") {
		// log warning
	} else {
		// throw error
		throw err;
	}
});

archive.on("error", function (err) {
	throw err;
});

for (const f of deleteEasytierFiles) {
	fs.rmSync(path.join(__dirname, releaseDirEasytier + f), { recursive: true, force: true });
}
const r = path.join(__dirname, releaseZipDir);
if (!fs.existsSync(r)) {
	fs.mkdirSync(r);
}

// pipe archive data to the file
archive.pipe(output);
archive
	.append(fs.createReadStream(path.join(__dirname, releaseExe)), { name: "easytier-game.exe" })
	.append(fs.createReadStream(path.join(__dirname, releaseHelp)), { name: "帮助.txt" })
	.append(fs.createReadStream(path.join(__dirname, releaseUninstall)), { name: "uninstall.exe" })
	.directory(path.join(__dirname, releaseDirEasytier), "easytier")
	.finalize();
