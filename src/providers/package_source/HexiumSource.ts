import { PackageSource, PackageSourceId } from './PackageSource';
import { getAxiosWithTimeouts } from '../../utils/HttpUtils';
import { retry } from '../../utils/Common';

export class HexiumSource implements PackageSource {
    id: PackageSourceId = 'hexium';
    name: string = 'Hexium';

    private static cache: Map<string, { data: any[]; timestamp: number }> = new Map();
    private static readonly CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

    async fetchIndex(community: string): Promise<any[]> {
        // Hexium currently only supports valheim
        const communityLower = community.toLowerCase();
        if (communityLower !== 'valheim') {
            return [];
        }

        const cached = HexiumSource.cache.get(communityLower);
        const now = Date.now();
        if (cached && (now - cached.timestamp) < HexiumSource.CACHE_TTL_MS) {
            return cached.data;
        }

        const endpoint = `https://valheim.hexium.gg/api/v1/package/`;
        const timeout = 15000;
        const axios = getAxiosWithTimeouts(timeout, timeout);
        const options = { attempts: 3, interval: 2000, throwLastErrorAsIs: false };

        try {
            const response = await retry(() => axios.get(endpoint), options);
            if (Array.isArray(response.data)) {
                const dataWithSource = response.data.map((pkg: any) => ({
                    ...pkg,
                    package_source: 'hexium'
                }));
                HexiumSource.cache.set(communityLower, { data: dataWithSource, timestamp: now });
                return dataWithSource;
            }
        } catch (e) {
            console.error('Failed to fetch package index from Hexium:', e);
            if (cached) {
                // Return stale cache on network failure
                return cached.data;
            }
        }

        return [];
    }

    getDownloadUrl(pkg: any, versionNumber: string): string {
        if (pkg.versions) {
            const ver = pkg.versions.find((v: any) => v.version_number === versionNumber);
            if (ver && ver.download_url) {
                return ver.download_url;
            }
        }
        return `https://valheim.hexium.gg/package/download/${pkg.owner}/${pkg.name}/${versionNumber}/`;
    }

    getPageUrl(pkg: any): string {
        return pkg.package_url || `https://valheim.hexium.gg/package/${pkg.owner}/${pkg.name}/`;
    }

    clearCache(): void {
        HexiumSource.cache.clear();
    }
}
