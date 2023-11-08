export namespace main {
	
	export class GenFilesOptions {
	    target: string;
	    name: string;
	    start: number;
	    total: number;
	    size: number;
	
	    static createFrom(source: any = {}) {
	        return new GenFilesOptions(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.target = source["target"];
	        this.name = source["name"];
	        this.start = source["start"];
	        this.total = source["total"];
	        this.size = source["size"];
	    }
	}

}

