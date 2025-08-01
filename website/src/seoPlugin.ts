import type { PluginOption } from 'vite';
import { libs } from '../libs.config';
import * as fs from 'node:fs';

export default function seoPlugin(): PluginOption {
    return {
        name: 'vite-plugin-seo',
        apply: 'build',
        enforce: 'post',
        generateBundle(_, bundle) {
            const urlset = Object.values(libs).map(
                (lib) => `<url><loc>https://discord.builders${lib.path}</loc><changefreq>monthly</changefreq></url>`
            );

            const redirects = Object.values(libs).map(
                (lib) => `${lib.path} / 200`
            );

            const headers = Object.values(libs).map(
                (lib) => `${lib.path}\n  Link: <https://discord.builders${lib.path}>; rel="canonical"\n`
            );

            this.emitFile({
                type: 'asset',
                fileName: 'sitemap.xml',
                source: `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://discord.builders/</loc><changefreq>monthly</changefreq><priority>1.0</priority></url>${urlset}</urlset>`,
            });

            this.emitFile({
                type: 'asset',
                fileName: 'robots.txt',
                source: `User-agent: *\nAllow: /\nSitemap: https://discord.builders/sitemap.xml\n`,
            });

            this.emitFile({
                type: 'asset',
                fileName: '404.html',
                source: fs.readFileSync("./404.html"),
            });

            this.emitFile({
                type: 'asset',
                fileName: '_redirects',
                source: `${redirects.join('\n')}\n`,
            });

            this.emitFile({
                type: 'asset',
                fileName: '_headers',
                source: `/\n  Link: <https://discord.builders/>; rel="canonical"\n\n${headers.join('\n')}`,
            });
        },
    };
}
