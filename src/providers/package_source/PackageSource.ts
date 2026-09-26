export type PackageSourceId = 'thunderstore' | 'hexium';

export interface PackageSource {
    id: PackageSourceId;
    name: string;
    fetchIndex(community: string): Promise<any[]>;
    getDownloadUrl(pkg: any, versionNumber: string): string;
    getPageUrl(pkg: any): string;
}
