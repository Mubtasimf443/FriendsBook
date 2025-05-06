const fs = require('fs');

/**
 * Generates random profile data matching the specified schema
 * @param {number} count - Number of profiles to generate
 * @param {string} outputFile - Path to save the generated data
 */
function generateProfileData(count = 1000, outputFile = 'profile-data.json') {
  // Enums and constants
  const PROFILE_CREATED_BY = ['self', 'parent', 'siblings', 'relative', 'friend'];
  const GENDERS = ['male', 'female'];
  const HEIGHTS = Array.from({ length: 72 }, (_, i) => {
    const feet = Math.floor((i + 48) / 12);
    const inches = (i + 48) % 12;
    return `${feet} foot ${inches} inch`;
  }).slice(0, 72); // 4'0" to 9'11"
  
  const EDUCATION_LEVELS = ["Primary Education (PSC)","Junior Secondary (JSC)","Secondary School Certificate (SSC)","Higher Secondary Certificate (HSC)","Diploma (Technical/Vocational)","Bachelor's Degree","Master's Degree","Doctorate (PhD)","Religious Education","Certificate Course","Technical/Vocational","Other"];
  
  const RELIGIONS = [
    'Christianity', 'Islam', 'Hinduism', 'Buddhism', 'Judaism', 'Sikhism',
    'Bahá\'í Faith', 'Jainism', 'Shinto', 'Taoism', 'Confucianism',
    'Zoroastrianism', 'Traditional African Religions', 'Native American Religions',
    'Rastafarianism', 'Wicca', 'Paganism'
  ];
  
  const LANGUAGES = ['Mandarin Chinese' ,'Spanish' ,'English' ,'Hindi' ,'Arabic' ,'Bengali' ,'Portuguese' ,'Russian' ,'Japanese' ,'Punjabi' ,'German' ,'Javanese' ,'Wu Chinese' ,'Telugu' ,'Vietnamese' ,'Marathi' ,'French' ,'Korean' ,'Tamil' ,'Italian' ,'Turkish' ,'Urdu' ,'Gujarati' ,'Polish' ,'Ukrainian' ,'Persian' ,'Malay' ,'Kannada' ,'Xiang Chinese' ,'Malayalam' ,'Sundanese' ,'Hausa' ,'Odia' ,'Burmese' ,'Hakka Chinese' ,'Tagalog/Filipino' ,'Yue Chinese/Cantonese' ,'Thai' ,'Swahili' ,'Romanian' ,'Dutch' ,'Kurdish' ,'Yoruba' ,'Amharic' ,'Indonesian' ,'Greek' ,'Czech' ,'Sindhi' ,'Uzbek' ,'Hungarian' ,'Belarusian' ,'Hebrew' ,'Azerbaijani' ,'Slovak' ,'Bulgarian' ,'Serbian' ,'Danish' ,'Finnish' ,'Norwegian' ,'Swedish' ,'Croatian' ,'Lithuanian' ,'Slovenian' ,'Latvian' ,'Estonian' ,'Georgian' ,'Armenian' ,'Albanian' ,'Mongolian' ,'Kazakh' ,'Nepali' ,'Assamese' ,'Tibetan' ,'Khmer' ,'Lao' ,'Pashto' ,'Zulu' ,'Xhosa' ];
  
  const FIRST_NAMES_MALE = [
    'James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph',
    'Thomas', 'Charles', 'Christopher', 'Daniel', 'Matthew', 'Anthony', 'Mark',
    'Donald', 'Steven', 'Paul', 'Andrew', 'Joshua', 'Kenneth', 'Kevin', 'Brian',
    'George', 'Edward', 'Ronald', 'Timothy', 'Jason', 'Jeffrey', 'Ryan', 'Jacob',
    'Gary', 'Nicholas', 'Eric', 'Jonathan', 'Stephen', 'Larry', 'Justin', 'Scott',
    'Brandon', 'Benjamin', 'Samuel', 'Gregory', 'Alexander', 'Frank', 'Patrick',
    'Raymond', 'Jack', 'Dennis', 'Jerry', 'Tyler', 'Aaron', 'Jose', 'Adam', 'Nathan',
    'Henry', 'Zakir', 'Rahul', 'Mohammed', 'Ali', 'Ahmed', 'Omar', 'Rahim', 'Karim',
    'Abdul', 'Hassan', 'Ibrahim', 'Imran', 'Tariq', 'Anwar', 'Jalal', 'Mahmoud',
    'Yousef', 'Salim', 'Malik', 'Adil', 'Bilal', 'Mustafa', 'Samir'
  ];
  
  const FIRST_NAMES_FEMALE = [
    'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan',
    'Jessica', 'Sarah', 'Karen', 'Nancy', 'Lisa', 'Betty', 'Margaret', 'Sandra',
    'Ashley', 'Kimberly', 'Emily', 'Donna', 'Michelle', 'Dorothy', 'Carol',
    'Amanda', 'Melissa', 'Deborah', 'Stephanie', 'Rebecca', 'Sharon', 'Laura',
    'Cynthia', 'Kathleen', 'Amy', 'Angela', 'Shirley', 'Anna', 'Brenda', 'Pamela',
    'Nicole', 'Ruth', 'Katherine', 'Samantha', 'Christine', 'Emma', 'Catherine',
    'Debra', 'Virginia', 'Rachel', 'Carolyn', 'Janet', 'Maria', 'Heather', 'Diane',
    'Julie', 'Joyce', 'Victoria', 'Kelly', 'Fatima', 'Aisha', 'Zainab', 'Maryam',
    'Amina', 'Layla', 'Noor', 'Huda', 'Sahar', 'Farah', 'Nadia', 'Leila',
    'Yasmin', 'Samira', 'Rania', 'Zahra', 'Salma', 'Sana', 'Hana', 'Sara'
  ];
  
  const LAST_NAMES = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
    'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
    'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
    'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
    'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
    'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
    'Carter', 'Roberts', 'Khan', 'Ahmed', 'Ali', 'Hassan', 'Rahman', 'Patel', 'Sharma',
    'Singh', 'Kaur', 'Chowdhury', 'Shah', 'Begum', 'Islam', 'Hossain', 'Miah', 'Akhtar',
    'Alam', 'Uddin', 'Islam', 'Rahman', 'Mia', 'Hussein', 'Mahmood', 'Yusuf', 'Malik'
  ];
  
  const EMAIL_DOMAINS = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com',
    'protonmail.com', 'aol.com', 'mail.com', 'zoho.com', 'yandex.com'
  ];
  
  const INSTITUTIONS = [
    'University of California', 'Stanford University', 'Harvard University', 'MIT',
    'Princeton University', 'Yale University', 'Columbia University', 'Duke University',
    'University of Chicago', 'University of Michigan', 'Cornell University', 'Dhaka University',
    'Bangladesh University of Engineering and Technology', 'Rajshahi University',
    'Chittagong University', 'Khulna University', 'Jahangirnagar University',
    'American International University-Bangladesh', 'North South University',
    'East West University', 'BRAC University', 'Independent University, Bangladesh',
    'Daffodil International University', 'United International University',
    'Ahsanullah University of Science and Technology', 'Military Institute of Science and Technology',
    'Bangladesh Agricultural University', 'Rajshahi University of Engineering & Technology',
    'Chittagong University of Engineering & Technology', 'Khulna University of Engineering & Technology'
  ];
  
  const CERTIFICATES = {
    'Primary Education (PSC)': ['PSC Certificate', 'Primary School Certificate'],
    'Junior Secondary (JSC)': ['JSC Certificate', 'Junior School Certificate'],
    'SSC': ['SSC Certificate', 'Science Group', 'Arts Group', 'Commerce Group'],
    'HSC': ['HSC Certificate', 'Science Group', 'Arts Group', 'Commerce Group'],
    'Diploma': ['Diploma in Engineering', 'Diploma in Medical Technology', 'Diploma in Business'],
    'Bachelor\'s Degree': [
      'BSc in Computer Science', 'BSc in Engineering', 'BBA', 'BA in English',
      'BSc in Mathematics', 'BSc in Physics', 'BSS in Political Science',
      'BSc in Agriculture', 'BSc in Marine Science', 'BSc in Civil Engineering',
      'BSc in Electrical Engineering', 'BSc in Mechanical Engineering',
      'BSc in Economics', 'BA in History', 'BA in Geography'
    ],
    'Master\'s Degree': [
      'MSc in Computer Science', 'MSc in Engineering', 'MBA', 'MA in English',
      'MSc in Mathematics', 'MSc in Physics', 'MSS in Political Science',
      'MSc in Agriculture', 'MSc in Marine Science', 'MSc in Civil Engineering',
      'MSc in Electrical Engineering', 'MSc in Mechanical Engineering',
      'MSc in Economics', 'MA in History', 'MA in Geography'
    ],
    'Doctorate': [
      'PhD in Computer Science', 'PhD in Engineering', 'PhD in Business',
      'PhD in English Literature', 'PhD in Mathematics', 'PhD in Physics',
      'PhD in Political Science', 'PhD in Agriculture', 'PhD in Marine Science',
      'PhD in Economics', 'PhD in History', 'PhD in Geography'
    ],
    'Religious Education': [
      'Islamic Studies Certificate', 'Quranic Studies Diploma',
      'Hafiz Certification', 'Madrasah Certificate', 'Religious Education Diploma'
    ],
    'Technical/Vocational': [
      'Certificate in Web Development', 'Certificate in Automotive Repair',
      'Certification in Nursing Assistance', 'Certificate in Plumbing',
      'Certificate in Electrical Wiring', 'Certificate in HVAC'
    ],
    'Certificate Course': [
      'Certificate in Digital Marketing', 'Certificate in Project Management',
      'Certificate in Data Science', 'Certificate in Graphic Design',
      'Certificate in Cloud Computing', 'Certificate in Cybersecurity'
    ],
    'Other': [
      'Professional Training', 'Industry Certification',
      'Specialized Workshop Completion', 'Language Proficiency Certificate'
    ]
  };
  
  const GRADES = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F'];
  
  const ADDITIONAL_INFO = [
    'Graduated with honors', 'Completed with distinction',
    'Class valedictorian', 'Top of class', 'Scholarship recipient',
    'Research assistant', 'Teaching assistant', 'Student council member',
    'Dean\'s list', 'Merit scholarship recipient', 'Perfect attendance',
    'Student of the year', 'Special achievement award'
  ];
  
  // Bangladesh geography data
  const GEOGRAPHY = {
    divisions:require('./data/division.json'),
    districts:require('./data/district.json'),
    upazilas:require('./data/upazilas.json'),
    unions: require('./data/unions.json')
  };
  
  // Helper functions
  const getRandomElement = arr => arr[Math.floor(Math.random() * arr.length)];
  const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const getRandomBool = () => Math.random() > 0.5;
  
  const generateRandomDate = (start, end) => {
    const startDate = new Date(start).getTime();
    const endDate = new Date(end).getTime();
    const randomDate = new Date(startDate + Math.random() * (endDate - startDate));
    return randomDate.toISOString().split('T')[0];
  };
  
  const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };
  
  const generateRandomPassword = () => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '@$!%*?&';
    
    let password = '';
    // Ensure at least one of each required character type
    for (let i = 0; i < 2; i++) {
        password += getRandomElement(uppercase);
        password += getRandomElement(lowercase);
        password += getRandomElement(numbers);
        password += getRandomElement(special);
    }
    
    
    // Fill the rest with random characters
    const allChars = uppercase + lowercase + numbers + special;
    const length = getRandomInt(8, 16);
    
    for (let i = password.length; i < length; i++) {
      password += getRandomElement(allChars);
    }
    
    // Shuffle the password
    return password.split('').sort(() => 0.5 - Math.random()).join('');
  };
  
  const generateRandomEmail = (name) => {
    // Convert name to lowercase and remove spaces
    const formattedName = name.toLowerCase().replace(/\s/g, '');
    // Add random number
    const randomNum = getRandomInt(1000060, 100000000000);
    // Get random domain
    const domain = getRandomElement(EMAIL_DOMAINS);
    
    return `${formattedName}${randomNum}@${domain}`;
  };
  
  const generateRandomPhoneNumber = () => {
    // Bangladesh mobile phone number format: 01XXX-XXXXXX
    const prefixes = ['1', '3', '4', '5', '6', '7', '8', '9'];
    const prefix = getRandomElement(prefixes);
    
    let number = '0' + prefix;
    
    for (let i = 0; i < 9; i++) {
      number += getRandomInt(0, 9);
    }
    
    return number;
  };
  
  const generateRandomAddress = () => {
    const division = getRandomElement(GEOGRAPHY.divisions);
    const validDistricts = GEOGRAPHY.districts.filter(d => d.division_id === division.id);
    const district = getRandomElement(validDistricts);
    
    const validUpazilas = GEOGRAPHY.upazilas.filter(u => u.district_id === district.id);
    const upazila = validUpazilas.length > 0 ? getRandomElement(validUpazilas) : { id: getRandomInt(1, 100), name: 'Unknown' };
    
    const validUnions = GEOGRAPHY.unions.filter(u => u.upazilla_id === upazila.id);
    const union = validUnions.length > 0 ? getRandomElement(validUnions) : { id: getRandomInt(1, 100), name: 'Unknown' };
    
    return {
      country: "Bangladesh",
      division: {
        id: ~~division.id
      },
      district: {
        id: ~~district.id
      },
      upazila: {
        id: ~~upazila.id
      },
      union: {
        id: ~~union.id
      }
    };
  };
  
  const generateEducation = (isEducated) => {
    if (!isEducated) return [];
    
    const numQualifications = getRandomInt(1, 3);
    const qualifications = [];
    
    for (let i = 0; i < numQualifications; i++) {
      const level = getRandomElement(EDUCATION_LEVELS);
      const certificate = getRandomElement(CERTIFICATES[level] || ['General Certificate']);
      const institution = getRandomElement(INSTITUTIONS);
      const yearOfCompletion = getRandomInt(1990, new Date().getFullYear());
      
      // Optional fields - 70% chance to include
      const includeGrade = Math.random() < 0.7;
      const includeAdditionalInfo = Math.random() < 0.7;
      
      const qualification = {
        level,
        certificate,
        institution,
        yearOfCompletion
      };
      
      if (includeGrade) {
        qualification.grade = getRandomElement(GRADES);
      }
      
      if (includeAdditionalInfo) {
        qualification.additionalInfo = getRandomElement(ADDITIONAL_INFO);
      }
      
      qualifications.push(qualification);
    }
    
    return qualifications;
  };
  
  // Generate profiles
  const profiles = [];
  
  for (let i = 0; i < count; i++) {
    // Determine gender first, as it affects other fields
    const gender = getRandomElement(GENDERS);
    
    // Generate date of birth based on gender constraints (Male: 21-70, Female: 18-70)
    const minYear = gender === 'male' ? 2000 : 2005;
    const maxYear = gender === 'male' ? 1990 : 1996 ;
    const dateOfBirth = generateRandomDate(`${minYear}-01-01`, `${maxYear}-12-31`);
    
    // Calculate age from date of birth
    const age = calculateAge(dateOfBirth);
    
    // Generate name based on gender
    const firstName = gender === 'male' 
      ? getRandomElement(FIRST_NAMES_MALE) 
      : getRandomElement(FIRST_NAMES_FEMALE);
    const lastName = getRandomElement(LAST_NAMES);
    const name = `${firstName} ${lastName}`;
    
    // Generate email based on name
    const email = generateRandomEmail(name);
    
    // Generate other fields
    const profileCreatedBy = getRandomElement(PROFILE_CREATED_BY);
    const height = getRandomElement(HEIGHTS);
    const weight = getRandomInt(40, 120);
    const isEducated = getRandomBool();
    const education = generateEducation(isEducated);
    const address = generateRandomAddress();
    const phoneNumber = generateRandomPhoneNumber();
    
    // Generate random number of languages (1-3)
    const numLanguages = getRandomInt(1, 3);
    const languageSet = new Set();
    while (languageSet.size < numLanguages) {
      languageSet.add(getRandomElement(LANGUAGES));
    }
    const languages = Array.from(languageSet);
    
    const religion = getRandomElement(RELIGIONS);
    const password = generateRandomPassword();
    
    // Create profile object
    const profile = {
      profileCreatedBy,
      gender,
      name,
      dateOfBirth,
      email,
      height,
      weight,
      isEducated,
      education,
      address,
      phoneInfo: {
        number: phoneNumber,
        country: {
          name: "Bangladesh",
          phone_code: "+88"
        }
      },
      languages,
      religion,
      password,
      confirmPassword: password,
      age
    };
    
    profiles.push(profile);
  }
  
  // Write to file
  fs.writeFileSync(outputFile, JSON.stringify(profiles, null, 2));
  console.log(`Generated ${count} profiles and saved to ${outputFile}`);
  return profiles;
}




  const count = 3000;
  const outputFile = process.argv[3] || 'profile-data.json';
  generateProfileData(count, outputFile);
