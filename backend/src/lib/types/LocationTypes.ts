/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

export interface IDivision {
    id : string ;
    name  : string ;
    bd_name :string ;
}

export interface IDistrict {
    id: string;
    division_id: string;
    name: string;
    bn_name: string;
    lat: string;
    long: string;
}

export interface IUpazila {
    id: string;
    district_id: string;
    name: string;
    bn_name: string;
}

export interface ICity {
    id: string;
    upazilla_id: string;
    name: string;
    bn_name: string;
}


