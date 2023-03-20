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

    static AssertObjectTypes(obj: any, types: object) {
        for (const [key, type] of Object.entries(types)) {
            if (!Object.hasOwnProperty.bind(obj)(key)) {
                return false;
            }

            if (typeof type === "string" && type.endsWith("[]")) {
                if (!Array.isArray(obj[key]))
                    return false;

                const trueType = type.slice(0, -2);

                if (trueType === "any")
                    continue;
                
                for (const item of obj[key]) {
                    if (typeof item !== trueType)
                        return false;
                }
            } else if (typeof type === "object") {
                if (typeof obj[key] !== "object")
                    return false;
                
                if (!this.AssertObjectTypes(obj[key], type))
                    return false;
            } else {
                if (typeof obj[key] !== type)
                    return false;
            }
        }

        return true;
    }
}