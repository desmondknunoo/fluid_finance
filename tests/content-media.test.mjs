import {test} from 'node:test';import assert from 'node:assert/strict';import {build} from 'esbuild';
const bundled=await build({entryPoints:['src/lib/content-media.ts'],bundle:true,write:false,platform:'node',format:'esm'});const{mediaSource,safeExternalUrl}=await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`);
test('known video URLs produce fixed trusted embed destinations',()=>{
 for(const url of ['https://youtu.be/jfKfPfyJRdk','https://www.youtube.com/watch?v=jfKfPfyJRdk','https://youtube.com/live/jfKfPfyJRdk'])assert.equal(mediaSource(url).embed,'https://www.youtube-nocookie.com/embed/jfKfPfyJRdk');
 assert.equal(mediaSource('https://x.com/name/status/123456?tracking=remove').url,'https://x.com/i/status/123456');assert.equal(mediaSource('https://www.instagram.com/reel/ABC_123/?igsh=private').url,'https://www.instagram.com/reel/ABC_123/');
});
test('embeds reject credential URLs, javascript and provider-domain lookalikes',()=>{
 for(const url of ['javascript:alert(1)','data:text/html,bad','http://youtube.com/watch?v=jfKfPfyJRdk','https://secret@youtube.com/watch?v=jfKfPfyJRdk','https://youtube.com:444/watch?v=jfKfPfyJRdk'])assert.equal(safeExternalUrl(url),null);
 assert.equal(mediaSource('https://youtube.com.evil.test/watch?v=jfKfPfyJRdk').provider,'External');assert.equal(mediaSource('https://www.youtube.com/watch?v=bad').embed,undefined);
});
test('audio and podcast URLs are supported without accepting arbitrary embed HTML',()=>{
 assert.equal(mediaSource('https://example.com/episode.mp3').provider,'Audio');assert.equal(mediaSource('https://open.spotify.com/episode/123abc').embed,'https://open.spotify.com/embed/episode/123abc');assert.equal(mediaSource('<iframe src="https://evil.test">'),null);
});
