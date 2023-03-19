export class Util {
    constructor() {
        throw new Error("This class may not be instantiated.");
    }

    static AssertObject(obj: any, keys: string[]) {
        if (typeof obj !== "object"){
            return false;
        }

        for (const key of keys) {
            if (!Object.hasOwnProperty.bind(obj)(key)) {
                return false;
            }
        }
        
        return true;
    }
}