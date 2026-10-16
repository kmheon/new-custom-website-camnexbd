/**
 * Comprehensive Bangladesh Geographic Data for CamneX Delivery and Site Quotations
 * Covers all 64 districts with major Thanas / Upazilas.
 */

export interface DistrictData {
  district: string;
  division: string;
  thanas: string[];
}

export const BANGLADESH_DISTRICTS: DistrictData[] = [
  // Dhaka Division
  {
    district: 'Dhaka',
    division: 'Dhaka',
    thanas: [
      'Gulshan', 'Banani', 'Dhanmondi', 'Uttara', 'Mirpur', 'Mohammadpur',
      'Motijheel', 'Tejgaon', 'Badda', 'Bhatara', 'Rampura', 'Khilgaon',
      'Paltan', 'Shahbagh', 'New Market', 'Lalbagh', 'Kotwali', 'Sutrapur',
      'Demra', 'Jatrabari', 'Kadamtali', 'Keraniganj', 'Savar', 'Dhamrai',
      'Ashulia', 'Kafrul', 'Cantonment', 'Hazaribagh', 'Adabor', 'Vatara'
    ]
  },
  {
    district: 'Gazipur',
    division: 'Dhaka',
    thanas: ['Gazipur Sadar', 'Tongi', 'Kaliakair', 'Kapasia', 'Sreepur', 'Kaliganj']
  },
  {
    district: 'Narayanganj',
    division: 'Dhaka',
    thanas: ['Narayanganj Sadar', 'Bandar', 'Fatullah', 'Siddhirganj', 'Rupganj', 'Araihazar', 'Sonargaon']
  },
  {
    district: 'Tangail',
    division: 'Dhaka',
    thanas: ['Tangail Sadar', 'Mirzapur', 'Kalihati', 'Ghatail', 'Madhupur', 'Sakhipur', 'Basail', 'Bhuapur', 'Delduar', 'Gopalpur', 'Nagarpur', 'Dhanbari']
  },
  {
    district: 'Manikganj',
    division: 'Dhaka',
    thanas: ['Manikganj Sadar', 'Singair', 'Saturia', 'Shivalaya', 'Harirampur', 'Ghior', 'Daulatpur']
  },
  {
    district: 'Munshiganj',
    division: 'Dhaka',
    thanas: ['Munshiganj Sadar', 'Sreenagar', 'Sirajdikhan', 'Lohajang', 'Tongibari', 'Gazaria']
  },
  {
    district: 'Narsingdi',
    division: 'Dhaka',
    thanas: ['Narsingdi Sadar', 'Palash', 'Shibpur', 'Belabo', 'Monohardi', 'Raipura']
  },
  {
    district: 'Kishoreganj',
    division: 'Dhaka',
    thanas: ['Kishoreganj Sadar', 'Bhairab', 'Bajitpur', 'Katiadi', 'Karimganj', 'Pakundia', 'Tarail', 'Hossainpur', 'Kuliarchar', 'Austagram', 'Itna', 'Mithamain', 'Nikli']
  },
  {
    district: 'Faridpur',
    division: 'Dhaka',
    thanas: ['Faridpur Sadar', 'Boalmari', 'Alfadanga', 'Madhukhali', 'Bhanga', 'Nagarkanda', 'Charbhadrasan', 'Sadarpur', 'Saltha']
  },
  {
    district: 'Gopalganj',
    division: 'Dhaka',
    thanas: ['Gopalganj Sadar', 'Kashiani', 'Kotalipara', 'Muksudpur', 'Tungipara']
  },
  {
    district: 'Madaripur',
    division: 'Dhaka',
    thanas: ['Madaripur Sadar', 'Shibchar', 'Kalkini', 'Rajoir']
  },
  {
    district: 'Rajbari',
    division: 'Dhaka',
    thanas: ['Rajbari Sadar', 'Goalanda', 'Pangsha', 'Baliakandi', 'Kalukhali']
  },
  {
    district: 'Shariatpur',
    division: 'Dhaka',
    thanas: ['Shariatpur Sadar', 'Zajira', 'Naria', 'Bhedarganj', 'Damudya', 'Gosairhat']
  },

  // Chittagong Division
  {
    district: 'Chittagong',
    division: 'Chittagong',
    thanas: [
      'Kotwali', 'Panchlaish', 'Pahartali', 'Halishahar', 'Double Mooring',
      'Bakalia', 'Bayazid', 'Chandgaon', 'Patenga', 'Khulshi', 'Karnafuli',
      'Anwara', 'Banshkhali', 'Boalkhali', 'Chandanaish', 'Fatikchhari',
      'Hathazari', 'Lohagara', 'Mirsharai', 'Patiya', 'Rangunia', 'Raozan',
      'Sandwip', 'Satkania', 'Sitakunda'
    ]
  },
  {
    district: "Cox's Bazar",
    division: 'Chittagong',
    thanas: ["Cox's Bazar Sadar", 'Chakaria', 'Maheshkhali', 'Teknaf', 'Ukhia', 'Ramu', 'Kutubdia', 'Pekua']
  },
  {
    district: 'Comilla',
    division: 'Chittagong',
    thanas: ['Comilla Adarsha Sadar', 'Comilla Sadar Dakshin', 'Barura', 'Brahmanpara', 'Burichang', 'Chandina', 'Chauddagram', 'Daudkandi', 'Debidwar', 'Homna', 'Laksam', 'Muradnagar', 'Nangalkot', 'Titas', 'Meghna', 'Monohargonj']
  },
  {
    district: 'Brahmanbaria',
    division: 'Chittagong',
    thanas: ['Brahmanbaria Sadar', 'Ashuganj', 'Nasirnagar', 'Nabinagar', 'Sarail', 'Kasba', 'Akhaura', 'Bancharampur', 'Bijoynagar']
  },
  {
    district: 'Chandpur',
    division: 'Chittagong',
    thanas: ['Chandpur Sadar', 'Faridganj', 'Haimchar', 'Haziganj', 'Kachua', 'Matlab Dakshin', 'Matlab Uttar', 'Shahrasti']
  },
  {
    district: 'Feni',
    division: 'Chittagong',
    thanas: ['Feni Sadar', 'Chhagalnaiya', 'Daganbhuiyan', 'Parshuram', 'Fulgazi', 'Sonagazi']
  },
  {
    district: 'Lakshmipur',
    division: 'Chittagong',
    thanas: ['Lakshmipur Sadar', 'Raipur', 'Ramganj', 'Ramgati', 'Kamalnagar']
  },
  {
    district: 'Noakhali',
    division: 'Chittagong',
    thanas: ['Noakhali Sadar', 'Begumganj', 'Chatkhil', 'Companiganj', 'Hatiya', 'Senbagh', 'Subarnachar', 'Kabirhat', 'Sonaimuri']
  },
  {
    district: 'Bandarban',
    division: 'Chittagong',
    thanas: ['Bandarban Sadar', 'Thanchi', 'Ruma', 'Rowangchhari', 'Lama', 'Alikadam', 'Naikhongchhari']
  },
  {
    district: 'Khagrachhari',
    division: 'Chittagong',
    thanas: ['Khagrachhari Sadar', 'Dighinala', 'Panchhari', 'Mahalchhari', 'Matiranga', 'Manikchhari', 'Ramgarh', 'Lakshmichhari', 'Guimara']
  },
  {
    district: 'Rangamati',
    division: 'Chittagong',
    thanas: ['Rangamati Sadar', 'Belaichhari', 'Bagaichhari', 'Barkal', 'Juraichhari', 'Kaptai', 'Kawkhali', 'Langadu', 'Naniarchar', 'Rajasthali']
  },

  // Sylhet Division
  {
    district: 'Sylhet',
    division: 'Sylhet',
    thanas: ['Sylhet Sadar', 'Dakshin Surma', 'Beanibazar', 'Golapganj', 'Zakiganj', 'Kanaighat', 'Jaintiapur', 'Gowainghat', 'Companiganj', 'Balaganj', 'Fenchuganj', 'Bishwanath', 'Osmani Nagar']
  },
  {
    district: 'Moulvibazar',
    division: 'Sylhet',
    thanas: ['Moulvibazar Sadar', 'Sreemangal', 'Kamalganj', 'Kulaura', 'Rajnagar', 'Barlekha', 'Juri']
  },
  {
    district: 'Habiganj',
    division: 'Sylhet',
    thanas: ['Habiganj Sadar', 'Madhabpur', 'Chunarughat', 'Bahubal', 'Nabiganj', 'Baniachong', 'Lakhai', 'Ajmiriganj', 'Sayestaganj']
  },
  {
    district: 'Sunamganj',
    division: 'Sylhet',
    thanas: ['Sunamganj Sadar', 'Chhatak', 'Jagannathpur', 'Derai', 'Dharampasha', 'Tahirpur', 'Bishwamvarpur', 'Jamalganj', 'Dowarabazar', 'Shantiganj', 'Madhyanagar']
  },

  // Rajshahi Division
  {
    district: 'Rajshahi',
    division: 'Rajshahi',
    thanas: ['Boalia', 'Motihar', 'Rajpara', 'Shah Makhdum', 'Chandrima', 'Kasiadanga', 'Katakhali', 'Paba', 'Godagari', 'Tanore', 'Mohanpur', 'Bagmara', 'Durgapur', 'Puthia', 'Charghat', 'Bagha']
  },
  {
    district: 'Bogra',
    division: 'Rajshahi',
    thanas: ['Bogra Sadar', 'Shajahanpur', 'Sherpur', 'Shibganj', 'Gabtali', 'Kahaloo', 'Nandigram', 'Dhunat', 'Sariakandi', 'Sonatola', 'Adamdighi', 'Dupchanchia']
  },
  {
    district: 'Pabna',
    division: 'Rajshahi',
    thanas: ['Pabna Sadar', 'Ishwardi', 'Atgharia', 'Bera', 'Bhangura', 'Chatmohar', 'Faridpur', 'Santhia', 'Sujanagar']
  },
  {
    district: 'Sirajganj',
    division: 'Rajshahi',
    thanas: ['Sirajganj Sadar', 'Shahjadpur', 'Ullapara', 'Belkuchi', 'Kamarkhanda', 'Kazipur', 'Raiganj', 'Tarash', 'Chauhali']
  },
  {
    district: 'Natore',
    division: 'Rajshahi',
    thanas: ['Natore Sadar', 'Baraigram', 'Bagatipara', 'Gurudaspur', 'Lalpur', 'Singra', 'Naldanga']
  },
  {
    district: 'Naogaon',
    division: 'Rajshahi',
    thanas: ['Naogaon Sadar', 'Mohadevpur', 'Manda', 'Badalgachhi', 'Patnitala', 'Dhamoirhat', 'Niamatpur', 'Atrai', 'Raninagar', 'Porsha', 'Sapahar']
  },
  {
    district: 'Chapai Nawabganj',
    division: 'Rajshahi',
    thanas: ['Nawabganj Sadar', 'Shibganj', 'Bholahat', 'Gomastapur', 'Nachole']
  },
  {
    district: 'Joypurhat',
    division: 'Rajshahi',
    thanas: ['Joypurhat Sadar', 'Panchbibi', 'Kalai', 'Khetlal', 'Akkelpur']
  },

  // Khulna Division
  {
    district: 'Khulna',
    division: 'Khulna',
    thanas: ['Khulna Sadar', 'Sonadanga', 'Khalishpur', 'Daulatpur', 'Khan Jahan Ali', 'Harintana', 'Aranghata', 'Batiaghata', 'Dacope', 'Dumuria', 'Dighalia', 'Koyra', 'Paikgachha', 'Phultala', 'Rupsha', 'Terokhada']
  },
  {
    district: 'Jessore',
    division: 'Khulna',
    thanas: ['Kotwali (Jessore Sadar)', 'Abhaynagar', 'Bagherpara', 'Chaugachha', 'Jhikargachha', 'Keshabpur', 'Manirampur', 'Sharsha']
  },
  {
    district: 'Kushtia',
    division: 'Khulna',
    thanas: ['Kushtia Sadar', 'Kumarkhali', 'Khoksa', 'Mirpur', 'Bheramara', 'Daulatpur']
  },
  {
    district: 'Satkhira',
    division: 'Khulna',
    thanas: ['Satkhira Sadar', 'Assasuni', 'Debhata', 'Kalaroa', 'Kaliganj', 'Shyamnagar', 'Tala']
  },
  {
    district: 'Jhenaidah',
    division: 'Khulna',
    thanas: ['Jhenaidah Sadar', 'Kaliganj', 'Kotchandpur', 'Maheshpur', 'Shailkupa', 'Harinakunda']
  },
  {
    district: 'Bagerhat',
    division: 'Khulna',
    thanas: ['Bagerhat Sadar', 'Mongla', 'Morrelganj', 'Fakirhat', 'Chitalmari', 'Kachua', 'Mollahat', 'Rampal', 'Sarankhola']
  },
  {
    district: 'Chuadanga',
    division: 'Khulna',
    thanas: ['Chuadanga Sadar', 'Alamdanga', 'Damurhuda', 'Jibannagar']
  },
  {
    district: 'Magura',
    division: 'Khulna',
    thanas: ['Magura Sadar', 'Mohammadpur', 'Shalikha', 'Sreepur']
  },
  {
    district: 'Meherpur',
    division: 'Khulna',
    thanas: ['Meherpur Sadar', 'Gangni', 'Mujibnagar']
  },
  {
    district: 'Narail',
    division: 'Khulna',
    thanas: ['Narail Sadar', 'Kalia', 'Lohagara']
  },

  // Barisal Division
  {
    district: 'Barisal',
    division: 'Barisal',
    thanas: ['Kotwali (Barisal Sadar)', 'Airport', 'Kowatkhali', 'Babuganj', 'Bakerganj', 'Banaripara', 'Gaurnadi', 'Hizla', 'Mehendiganj', 'Muladi', 'Wazirpur', 'Agailjhara']
  },
  {
    district: 'Patuakhali',
    division: 'Barisal',
    thanas: ['Patuakhali Sadar', 'Bauphal', 'Galachipa', 'Dashmina', 'Kalapara', 'Mirzaganj', 'Dumki', 'Rangabali']
  },
  {
    district: 'Bhola',
    division: 'Barisal',
    thanas: ['Bhola Sadar', 'Burhanuddin', 'Char Fasson', 'Daulatkhan', 'Lalmohan', 'Manpura', 'Tazumuddin']
  },
  {
    district: 'Pirojpur',
    division: 'Barisal',
    thanas: ['Pirojpur Sadar', 'Bhandaria', 'Mathbaria', 'Kawkhali', 'Nazirpur', 'Nesarabad (Swarupkati)', 'Indurkani']
  },
  {
    district: 'Barguna',
    division: 'Barisal',
    thanas: ['Barguna Sadar', 'Amtali', 'Betagi', 'Bamna', 'Patharghata', 'Taltali']
  },
  {
    district: 'Jhalokati',
    division: 'Barisal',
    thanas: ['Jhalokati Sadar', 'Kathalia', 'Nalchity', 'Rajapur']
  },

  // Rangpur Division
  {
    district: 'Rangpur',
    division: 'Rangpur',
    thanas: ['Kotwali (Rangpur Sadar)', 'Badarganj', 'Gangachhara', 'Kaunia', 'Mithapukur', 'Pirgachha', 'Pirganj', 'Taraganj']
  },
  {
    district: 'Dinajpur',
    division: 'Rangpur',
    thanas: ['Dinajpur Sadar', 'Birganj', 'Biral', 'Bochaganj', 'Chirirbandar', 'Fulbari', 'Ghoraghat', 'Hakimpur', 'Kaharole', 'Khansama', 'Nawabganj', 'Parbatipur']
  },
  {
    district: 'Kurigram',
    division: 'Rangpur',
    thanas: ['Kurigram Sadar', 'Nageshwari', 'Bhurungamari', 'Phulbari', 'Rajarhat', 'Ulipur', 'Chilmari', 'Roumari', 'Char Rajibpur']
  },
  {
    district: 'Gaibandha',
    division: 'Rangpur',
    thanas: ['Gaibandha Sadar', 'Gobindaganj', 'Palashbari', 'Sadullapur', 'Saghata', 'Sundarganj', 'Phulchhari']
  },
  {
    district: 'Nilphamari',
    division: 'Rangpur',
    thanas: ['Nilphamari Sadar', 'Saidpur', 'Domar', 'Dimla', 'Jaldhaka', 'Kishoreganj (Nilphamari)']
  },
  {
    district: 'Thakurgaon',
    division: 'Rangpur',
    thanas: ['Thakurgaon Sadar', 'Pirganj', 'Ranisankail', 'Baliadangi', 'Haripur']
  },
  {
    district: 'Panchagarh',
    division: 'Rangpur',
    thanas: ['Panchagarh Sadar', 'Boda', 'Debiganj', 'Atwari', 'Tetulia']
  },
  {
    district: 'Lalmonirhat',
    division: 'Rangpur',
    thanas: ['Lalmonirhat Sadar', 'Aditmari', 'Kaliganj', 'Hatibandha', 'Patgram']
  },

  // Mymensingh Division
  {
    district: 'Mymensingh',
    division: 'Mymensingh',
    thanas: ['Kotwali (Mymensingh Sadar)', 'Muktagachha', 'Valuka', 'Trishal', 'Gauripur', 'Ishwarganj', 'Nandail', 'Phulpur', 'Haluaghat', 'Dhobaura', 'Bhaluka', 'Tara Khanda']
  },
  {
    district: 'Jamalpur',
    division: 'Mymensingh',
    thanas: ['Jamalpur Sadar', 'Melandaha', 'Islampur', 'Dewanganj', 'Sarishabari', 'Madarganj', 'Bakshiganj']
  },
  {
    district: 'Netrokona',
    division: 'Mymensingh',
    thanas: ['Netrokona Sadar', 'Barhatta', 'Durgapur', 'Kendua', 'Atpara', 'Madan', 'Khaliajuri', 'Kalmakanda', 'Mohanganj', 'Purbadhala']
  },
  {
    district: 'Sherpur',
    division: 'Mymensingh',
    thanas: ['Sherpur Sadar', 'Nakla', 'Nalitabari', 'Sreebardi', 'Jhenaigati']
  }
];

export const DISTRICT_NAMES = BANGLADESH_DISTRICTS.map(d => d.district);

export function getThanasForDistrict(districtName: string): string[] {
  const found = BANGLADESH_DISTRICTS.find(
    d => d.district.toLowerCase() === (districtName || '').trim().toLowerCase()
  );
  return found ? found.thanas : [];
}
