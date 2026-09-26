import { PackageSource, PackageSourceId } from './PackageSource';
import { fetchAndProcessBlobFile, getAxiosWithTimeouts } from '../../utils/HttpUtils';
import { retry } from '../../utils/Common';
import { transformPackageUrl } from '../cdn/PackageUrlTransformer';
import CdnProvider from '../generic/connection/CdnProvider';

export class ThunderstoreSource implements PackageSource {
    id: PackageSourceId = 'thunderstore';
    name: string = 'Thunderstore';

    async fetchIndex(communityUrl: string): Promise<any[]> {
        const packageIndexUrl = transformPackageUrl(communityUrl);
        const indexUrl = CdnProvider.addCdnQueryParameter(packageIndexUrl);
        const options = { attempts: 5, interval: 2000, throwLastErrorAsIs: true };
        const index = await retry(() => fetchAndProcessBlobFile(indexUrl, { computeHash: true }), options);
        return index.content;
    }

    getDownloadUrl(pkg: any, versionNumber: string): string {
        if (pkg.versions) {
            const ver = pkg.versions.find((v: any) => v.version_number === versionNumber);
            if (ver && ver.download_url) {
                return ver.download_url;
            }
        }
        return `https://thunderstore.io/package/download/${pkg.owner}/${pkg.name}/${versionNumber}/`;
    }

    getPageUrl(pkg: any): string {
        return pkg.package_url || `https://thunderstore.io/package/${pkg.owner}/${pkg.name}/`;
    }
}
