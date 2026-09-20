/** Public assets work at both the stable root and a GitHub project subpath. */
export const assetUrl = (path:string):string => `${import.meta.env.BASE_URL}${path.replace(/^\//,'')}`;
