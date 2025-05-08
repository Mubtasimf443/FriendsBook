
function calculateProfileCompleteness(user: any): number {
    const requiredFields = [
        'name',
        'email',
        'gender',
        'dateOfBirth',
        'height',
        'weight',
        'religion',
        'address',
        'phoneInfo',
        'languages'
    ];

    const optionalFields = [
        'profileImage',
        'aboutMe',
        'familyInfo',
        'education',
        'occupation',
        'annualIncome'
    ];

    const requiredFieldsCount = requiredFields.filter(field => 
        user[field] !== undefined && user[field] !== null
    ).length;

    const optionalFieldsCount = optionalFields.filter(field => 
        user[field] !== undefined && user[field] !== null
    ).length;

    return Math.round(
        ((requiredFieldsCount / requiredFields.length) * 0.7 + 
         (optionalFieldsCount / optionalFields.length) * 0.3) * 100
    );
}