import { describe, it, expect, beforeAll } from 'vitest';
import { HexiumSource } from '../../../../../src/providers/package_source/HexiumSource';
import ThunderstoreMod from '../../../../../src/model/ThunderstoreMod';
import ManifestV2 from '../../../../../src/model/ManifestV2';
import ProfileModule from '../../../../../src/store/modules/ProfileModule';
import PathResolver from '../../../../../src/r2mm/manager/PathResolver';
import { providePathImplementation } from '../../../../../src/providers/node/path/path';
import { TestPathProvider } from '../../../stubs/providers/node/Node.Path.Provider';

describe('Hexium Integration Unit Tests', () => {

    beforeAll(() => {
        providePathImplementation(() => TestPathProvider);
        PathResolver.MOD_ROOT = '/mock/mod/root';
    });

    describe('HexiumSource provider', () => {
        it('should return empty list for non-Valheim communities', async () => {
            const source = new HexiumSource();
            const results = await source.fetchIndex('RiskOfRain2');
            expect(results).toEqual([]);
        });

        it('should format download and page URLs correctly', () => {
            const source = new HexiumSource();
            const pkg = { owner: 'AuthorName', name: 'CoolMod', package_url: 'https://valheim.hexium.gg/package/AuthorName/CoolMod/' };

            expect(source.getPageUrl(pkg)).toBe('https://valheim.hexium.gg/package/AuthorName/CoolMod/');
            expect(source.getDownloadUrl(pkg, '1.2.3')).toBe('https://valheim.hexium.gg/package/download/AuthorName/CoolMod/1.2.3/');
        });
    });

    describe('ThunderstoreMod Source & Update Tagging', () => {
        it('should correctly set and get package source', () => {
            const mod = new ThunderstoreMod();
            expect(mod.getPackageSource()).toBe('thunderstore');
            expect(mod.isHexiumSource()).toBe(false);

            mod.setPackageSource('hexium');
            expect(mod.getPackageSource()).toBe('hexium');
            expect(mod.isHexiumSource()).toBe(true);
        });

        it('should set Hexium update flag and version', () => {
            const mod = new ThunderstoreMod();
            expect(mod.getHasHexiumUpdate()).toBe(false);

            mod.setHasHexiumUpdate(true, '2.0.0');
            expect(mod.getHasHexiumUpdate()).toBe(true);
            expect(mod.getHexiumLatestVersion()).toBe('2.0.0');
        });
    });

    describe('ManifestV2 Package Source Persistence', () => {
        it('should default packageSource to thunderstore and retain hexium when set', () => {
            const manifest = new ManifestV2();
            expect(manifest.getPackageSource()).toBe('thunderstore');

            manifest.setPackageSource('hexium');
            expect(manifest.getPackageSource()).toBe('hexium');

            const jsObj = {
                manifestVersion: 2,
                name: 'Author-HexiumMod',
                authorName: 'Author',
                displayName: 'HexiumMod',
                description: 'test',
                versionNumber: { major: 1, minor: 0, patch: 0 },
                packageSource: 'hexium'
            };
            const restored = new ManifestV2().fromJsObject(jsObj);
            expect(restored.getPackageSource()).toBe('hexium');
        });
    });

    describe('Update Isolation in ProfileModule', () => {
        it('should exclude Hexium installed mods from batch modsWithUpdates', () => {
            const tsMod = new ManifestV2();
            tsMod.setName('Author-TSMod');
            tsMod.setPackageSource('thunderstore');

            const hexiumMod = new ManifestV2();
            hexiumMod.setName('Author-HexiumMod');
            hexiumMod.setPackageSource('hexium');

            const state = {
                modList: [tsMod, hexiumMod]
            };

            const mockRootGetters = {
                'tsMods/cachedMod': (mod: ManifestV2) => {
                    const mockTs = new ThunderstoreMod();
                    mockTs.setName(mod.getName());
                    mockTs.setPackageSource(mod.getPackageSource());
                    return {
                        tsMod: mockTs,
                        isLatest: false
                    };
                }
            };

            const getters = ProfileModule.getters as any;
            const updates: ThunderstoreMod[] = getters.modsWithUpdates(state, null, null, mockRootGetters);

            expect(updates.length).toBe(1);
            expect(updates[0]!.getPackageSource()).toBe('thunderstore');
        });
    });

    describe('Hexium Route and Filtering', () => {
        it('should have manager.hexium route configured', async () => {
            const routesModule = await import('../../../../../src/router/routes');
            const routes = routesModule.default;
            const layoutRoute = routes.find(r => r.children?.some(c => c.name === 'manager'));
            expect(layoutRoute).toBeDefined();
            const managerRoute = layoutRoute?.children?.find(c => c.name === 'manager');
            expect(managerRoute).toBeDefined();
            const hexiumRoute = managerRoute?.children?.find(c => c.name === 'manager.hexium');
            expect(hexiumRoute).toBeDefined();
            expect(hexiumRoute?.path).toBe('hexium/');
        });

        it('should filter Thunderstore vs Hexium mods separately', () => {
            const tsMod = new ThunderstoreMod();
            tsMod.setName('TS Mod');
            tsMod.setPackageSource('thunderstore');

            const hexiumMod = new ThunderstoreMod();
            hexiumMod.setName('Hexium Mod');
            hexiumMod.setPackageSource('hexium');

            const allMods = [tsMod, hexiumMod];

            const filteredTs = allMods.filter(m => !m.isHexiumSource());
            const filteredHexium = allMods.filter(m => m.isHexiumSource());

            expect(filteredTs.length).toBe(1);
            expect(filteredTs[0]?.getName()).toBe('TS Mod');

            expect(filteredHexium.length).toBe(1);
            expect(filteredHexium[0]?.getName()).toBe('Hexium Mod');
        });
    });
});
