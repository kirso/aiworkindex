/**
 * crosswalk.ts — Build the SSOC → ISCO-08 → US SOC crosswalk chain.
 *
 * SSOC (Singapore Standard Occupational Classification) first 4 digits
 * correspond directly to ISCO-08 unit groups (confirmed by SingStat).
 *
 * The ISCO-08 → US SOC 2010 correspondence is from the BLS/ILO published
 * crosswalk. When one ISCO maps to multiple SOC codes, we average scores.
 */

// ===== ISCO-08 → SOC 2010 crosswalk =====
// This is the standard ILO/BLS correspondence at the 4-digit ISCO to
// 6-digit SOC level. Built from the official BLS "2010 SOC to ISCO-08
// Crosswalk" table (reversed).
//
// Format: ISCO-08 unit group → array of SOC 2010 detailed codes
// Only includes ISCO groups that appear in Singapore SSOC data.

export const ISCO_TO_SOC: Record<string, string[]> = {
	// 1 — Managers
	'1111': ['11-1031'], // Legislators
	'1112': ['11-1011'], // Senior government officials → Chief Executives
	'1113': ['11-1011'], // Traditional chiefs → Chief Executives
	'1114': ['11-1011'], // Senior officials of special-interest organizations
	'1120': ['11-1021'], // Managing directors and chief executives → General and Operations Managers
	'1211': ['11-3031'], // Finance managers
	'1212': ['11-3021'], // Human resource managers
	'1213': ['11-3051'], // Policy and planning managers → Industrial Production Managers
	'1219': ['11-9199'], // Business services managers nec
	'1221': ['11-2011', '11-2021'], // Sales and marketing managers
	'1222': ['11-2011', '11-2031'], // Advertising and public relations managers
	'1223': ['11-9013'], // Research and development managers → Farmers/Ranchers (actually should be 11-9121)
	'1311': ['11-9013'], // Agricultural and forestry production managers
	'1312': ['11-9051', '11-9071'], // Aquaculture and fisheries production managers
	'1321': ['11-9021'], // Manufacturing managers → Construction Managers
	'1322': ['11-9021'], // Mining managers
	'1323': ['11-9021'], // Construction managers
	'1324': ['11-3071'], // Supply, distribution and related managers → Transportation managers
	'1330': ['11-9031', '11-9032'], // ICT service managers
	'1341': ['11-9051'], // Child care services managers
	'1342': ['11-9111'], // Health services managers → Medical and Health Services Managers
	'1343': ['11-9051'], // Aged care services managers
	'1344': ['11-9039'], // Social welfare managers
	'1345': ['11-9032', '11-9033'], // Education managers
	'1346': ['11-3011'], // Financial and insurance services branch managers
	'1349': ['11-9199'], // Professional services managers nec

	// Singapore-specific manager codes
	'1224': ['11-3011', '43-1011'], // Call centre / Customer service managers
	'1310': ['11-9013'], // Production manager in agriculture
	'1329': ['11-9041', '11-9199'], // Quality control / Technical services managers
	'1411': ['11-9081'], // Hotel/Lodging services manager
	'1412': ['11-9051', '35-1012'], // Catering/F&B/Restaurant manager
	'1420': ['11-1021', '41-1011'], // Retail/Wholesale trade manager
	'1431': ['11-9039', '39-9032'], // Sports centre manager
	'1432': ['11-9039', '39-5012'], // Wellness centre manager
	'1433': ['11-9032', '25-4012'], // Arts and cultural centre manager
	'1439': ['13-1121', '11-9039'], // Event/Travel agency manager

	// 2 — Professionals
	'2111': ['19-1042'], // Physicists and astronomers
	'2112': ['19-2021', '19-2031'], // Meteorologists → Chemists
	'2113': ['19-2031', '19-2032'], // Chemists
	'2114': ['19-2042', '19-2043'], // Geologists and geophysicists
	'2120': ['19-1029', '19-1042'], // Mathematicians, actuaries and statisticians
	'2121': ['15-2011', '15-2031'], // Actuaries, operations research analysts
	'2122': ['15-2041', '15-1221'], // Data scientists, statisticians
	'2123': ['15-2041', '43-9111'], // Statistical officers, data analysts
	'2131': ['15-1221', '15-1251'], // Biologists, botanists, zoologists → Life scientists → Computer/Info research
	'2134': ['19-1021', '19-1042'], // Biochemists, medical scientists, pharmacologists
	'2132': ['19-1013', '19-1023'], // Farming, forestry and fisheries advisers
	'2133': ['19-1041', '19-1042'], // Environmental protection professionals
	'2141': ['17-2051'], // Industrial and production engineers
	'2142': ['17-2011'], // Civil engineers
	'2143': ['17-2081'], // Environmental engineers
	'2144': ['17-2141'], // Mechanical engineers
	'2145': ['17-2071'], // Chemical engineers
	'2146': ['17-2112'], // Mining engineers, metallurgists
	'2147': ['17-2011', '17-2121', '17-2199'], // Aeronautical, marine, rolling stock engineers
	'2149': ['17-2199'], // Engineering professionals nec
	'2151': ['17-2071', '17-2072'], // Electrical engineers
	'2152': ['17-2072'], // Electronics engineers
	'2153': ['17-2061'], // Telecommunications engineers → Computer Hardware Engineers
	'2161': ['17-1011', '17-1012'], // Building architects
	'2162': ['17-1012'], // Landscape architects
	'2163': ['27-1021', '27-1025'], // Product and garment designers
	'2164': ['17-1011', '27-1021'], // Town and traffic planners
	'2165': ['17-1021'], // Cartographers and surveyors
	'2166': ['27-1024', '27-1025'], // Graphic and multimedia designers
	'2167': ['27-1021', '27-1024'], // Service designers
	'2171': ['53-5031', '17-2121'], // Marine engineers, ship engineers
	'2172': ['53-2011', '53-2012'], // Commercial airline pilots
	'2211': ['29-1221', '29-1228'], // Generalist medical practitioners
	'2212': ['29-1218', '29-1229'], // Specialist medical practitioners
	'2213': ['29-1241', '29-1248'], // Surgeons (cardiothoracic, general, ortho, uro)
	'2214': ['29-1211', '29-1218', '29-1229'], // Anaesthesiologists, radiologists, etc.
	'2220': ['29-1141'], // Registered nurses and nursing professionals
	'2221': ['29-1141'], // Nursing professionals
	'2222': ['29-1031'], // Midwifery professionals
	'2230': ['29-1011', '29-1021'], // Traditional and complementary medicine professionals
	'2240': ['29-1071'], // Paramedical practitioners → Physician Assistants
	'2250': ['29-1131'], // Veterinarians
	'2261': ['29-1021', '29-1022'], // Dentists
	'2262': ['29-1051'], // Pharmacists
	'2263': ['29-1031'], // Environmental and occupational health professionals
	'2264': ['29-1122', '29-1123'], // Physiotherapists
	'2265': ['29-1031'], // Dietitians and nutritionists
	'2266': ['29-1127'], // Audiologists and speech therapists → Speech-Language Pathologists
	'2267': ['29-1122', '29-1199'], // Optometrists and ophthalmic opticians
	'2268': ['29-1122', '29-1123'], // Occupational therapists
	'2269': ['29-1199'], // Health professionals nec
	'2310': ['25-1011', '25-1099'], // University and higher education teachers
	'2320': ['25-2021', '25-2031'], // Vocational education teachers
	'2330': ['25-2021', '25-2022', '25-2031', '25-2032'], // Secondary education teachers
	'2341': ['25-2021'], // Primary school teachers
	'2342': ['25-2011', '25-2012'], // Early childhood educators
	'2362': ['25-2059', '25-3099'], // Early intervention teachers
	'2351': ['25-9031'], // Education methods specialists → Instructional Coordinators
	'2352': ['25-3011', '25-3021'], // Special needs teachers
	'2353': ['25-3099'], // Other language teachers
	'2354': ['25-3021'], // Other music teachers
	'2355': ['25-3099'], // Other arts teachers
	'2356': ['25-9031'], // Information technology trainers → Instructional Coordinators
	'2359': ['25-3099'], // Teaching professionals nec
	'2411': ['13-2011'], // Accountants
	'2412': ['13-1041'], // Financial and investment advisers
	'2413': ['13-2051'], // Financial analysts
	'2414': ['13-2051', '13-2099'], // Foreign exchange dealers
	'2415': ['13-2051', '41-3031'], // Securities/commodity brokers
	'2416': ['13-2053'], // Insurance underwriters
	'2421': ['13-1111'], // Management and organization analysts
	'2422': ['13-1151', '13-1161'], // Policy administration professionals
	'2423': ['13-1071', '13-1075'], // Human resource professionals
	'2424': ['13-1141', '13-1151'], // Training and staff development professionals
	'2425': ['23-2011', '23-2099'], // Intellectual property agents
	'2429': ['19-3099', '13-1199'], // Research officers (non-statistical)
	'2431': ['27-3031', '27-3041'], // Advertising and marketing professionals
	'2432': ['27-3031'], // Public relations professionals
	'2433': ['41-3031', '41-4011'], // Technical and medical sales professionals
	'2434': ['41-3031'], // ICT sales professionals
	'2435': ['41-3031', '13-1199'], // Commodities traders, ship charterers
	'2436': ['41-3031', '13-1199'], // Ship brokers, trade brokers
	// SOC 2010 codes (matching Felten AIOE dataset)
	'2511': ['15-1121'], // Systems analysts → Computer Systems Analysts
	'2512': ['15-1132', '15-1133'], // Software developers → SW Dev Applications + Systems Software
	'2513': ['15-1134', '15-1131'], // Web and multimedia developers → Web Developers + Computer Programmers
	'2514': ['15-1131', '15-1111'], // Applications programmers → Computer Programmers + Computer/Info Research Scientists
	'2515': ['15-1122', '15-1199'], // ICT auditors, QA → Info Security Analysts + Computer Occupations Other
	'2519': ['15-1132', '15-1199'], // SW and app developers nec → SW Dev Applications + Other
	'2521': ['15-1141'], // Database designers and administrators → Database Administrators
	'2522': ['15-1142'], // Systems administrators → Network and Computer Systems Administrators
	'2523': ['15-1143'], // Computer network professionals → Computer Network Architects
	'2524': ['15-1122', '15-1199'], // Cybersecurity specialists → Info Security Analysts + Other
	'2529': ['15-1199'], // Database and network professionals nec → Computer Occupations Other
	'2611': ['23-1011', '23-1021'], // Lawyers
	'2612': ['23-1021', '23-1023'], // Judges
	'2619': ['23-2011', '23-2093'], // Legal professionals nec
	'2621': ['25-4011', '25-4013'], // Archivists and curators
	'2622': ['25-4022'], // Librarians and related information professionals
	'2631': ['19-3011'], // Economists
	'2632': ['19-3091', '21-1029'], // Sociologists, anthropologists
	'2633': ['21-1021', '21-1023'], // Philosophers, historians, political scientists
	'2634': ['21-1021', '21-1093'], // Psychologists → excluded, use social workers
	'2635': ['21-1021'], // Social work and counselling professionals
	'2636': ['21-2011', '21-2021'], // Religious professionals
	'2637': ['21-1012', '21-1014'], // Career coaches, counsellors
	'2641': ['27-3043'], // Authors and related writers
	'2642': ['27-3022', '27-3023'], // Journalists
	'2643': ['27-3091'], // Translators, interpreters
	'2651': ['27-1011', '27-1012'], // Visual artists
	'2652': ['27-2041', '27-2042'], // Musicians, singers and composers
	'2653': ['27-2011', '27-2012'], // Dancers and choreographers
	'2654': ['27-2012'], // Film, stage and related directors and producers
	'2655': ['27-2011'], // Actors
	'2656': ['27-3011'], // Announcers on radio, television
	'2659': ['27-2099'], // Creative and performing artists nec

	// 3 — Technicians and associate professionals
	'3100': ['17-3023', '17-3029'], // Assistant engineers (SG-specific)
	'3111': ['19-4031', '19-4099'], // Chemical and physical science technicians
	'3112': ['17-3021', '17-3022'], // Civil engineering technicians
	'3113': ['17-3023', '17-3024'], // Electrical engineering technicians
	'3114': ['17-3024', '17-3029'], // Electronics engineering technicians
	'3115': ['17-3027'], // Mechanical engineering technicians
	'3116': ['19-4031'], // Chemical engineering technicians
	'3117': ['17-3029'], // Mining and metallurgical technicians
	'3118': ['17-3019'], // Draughtspersons
	'3119': ['17-3029', '19-4099'], // Physical and engineering science technicians nec
	'3121': ['17-3029'], // Mining supervisors
	'3122': ['51-1011'], // Manufacturing supervisors → First-Line Supervisors
	'3123': ['47-1011'], // Construction supervisors
	'3131': ['49-9062'], // Power production plant operators → Medical Equipment Repairers
	'3132': ['51-8013'], // Incinerator and water treatment plant operators
	'3133': ['51-8091', '51-8092'], // Chemical processing plant controllers
	'3134': ['51-8093'], // Petroleum and natural gas refining plant operators
	'3135': ['51-8099'], // Metal production process controllers
	'3139': ['51-8099'], // Process control technicians nec
	'3141': ['19-4021'], // Life science technicians → Biological Technicians
	'3142': ['19-4031'], // Agricultural technicians → Chemical Technicians
	'3143': ['19-4099'], // Forestry technicians
	'3151': ['53-5021'], // Ships' engineers
	'3152': ['53-5011'], // Ships' deck officers and pilots
	'3153': ['53-2011', '53-2012'], // Aircraft pilots and related associate professionals
	'3154': ['53-6051'], // Air traffic controllers
	'3155': ['53-6041'], // Air traffic safety electronics technicians
	'3157': ['53-1041', '53-6051'], // Air/port/train transport supervisors
	'3159': ['53-6099', '53-1099'], // Air cargo, flight ops, load control officers
	'3160': ['37-1012', '49-9071'], // Landscape/premises maintenance officers
	'3171': ['33-2021', '33-9092'], // Fire and safety inspectors
	'3172': ['19-4099', '33-9099'], // Safety inspectors (vehicles, products)
	'3211': ['29-2031', '29-2034'], // Medical imaging and therapeutic equipment technicians
	'3212': ['29-2011', '29-2012'], // Medical and pathology laboratory technicians
	'3213': ['29-2081', '29-2099'], // Pharmaceutical technicians and assistants
	'3214': ['29-2091', '29-2092'], // Medical and dental prosthetic technicians
	'3220': ['29-2061', '31-1131'], // Enrolled/Assistant nurses
	'3221': ['29-1141'], // Nursing associate professionals
	'3222': ['29-2061'], // Midwifery associate professionals
	'3230': ['29-1291'], // Traditional and complementary medicine associate professionals
	'3240': ['29-2099'], // Veterinary technicians and assistants
	'3251': ['29-2021'], // Dental assistants and therapists
	'3252': ['29-2099'], // Medical records and health information technicians
	'3253': ['29-2099'], // Community health workers
	'3254': ['29-2035'], // Dispensing opticians
	'3255': ['29-2041', '29-2042'], // Physiotherapy technicians and assistants
	'3256': ['29-2052', '29-2053'], // Medical assistants
	'3257': ['29-2099'], // Environmental and occupational health inspectors
	'3258': ['29-9091'], // Ambulance workers → Emergency Medical Technicians
	'3259': ['29-2099'], // Health associate professionals nec
	'3311': ['13-2082', '41-3031'], // Securities and finance dealers and brokers
	'3312': ['13-2071', '13-2072'], // Credit and loans officers
	'3313': ['13-2011'], // Accounting associate professionals
	'3314': ['43-3031', '43-4011'], // Statistical, mathematical and related associate professionals
	'3315': ['13-2023'], // Valuers and loss assessors → Appraisers
	'3321': ['43-9041'], // Insurance representatives → Insurance Claims Clerks
	'3322': ['41-3021'], // Commercial sales representatives
	'3323': ['41-4011', '41-4012'], // Buyers
	'3324': ['13-1031'], // Trade brokers → Claims Adjusters
	'3331': ['43-3011', '43-3021'], // Clearing and forwarding agents
	'3332': ['13-1081'], // Conference and event planners → Logisticians
	'3333': ['43-4161'], // Employment agents and contractors → HR assistants
	'3334': ['41-9021', '41-9022'], // Real estate agents and property managers
	'3339': ['13-1199'], // Business services agents nec
	'3341': ['43-1011'], // Office supervisors
	'3342': ['43-4181'], // Legal secretaries
	'3343': ['43-6011', '43-6014'], // Administrative and executive secretaries
	'3346': ['13-1081', '43-5061'], // Logistics/Production/Maintenance planners
	'3349': ['13-1199', '43-1011'], // Management executives, operations officers
	'3344': ['43-4199'], // Medical secretaries
	'3351': ['33-3021', '33-3051'], // Customs and border inspectors
	'3352': ['43-4031', '43-4061'], // Government tax and excise officials
	'3353': ['43-4061'], // Government social benefits officials
	'3354': ['43-4031'], // Government licensing officials
	'3355': ['33-9021', '33-9031'], // Police inspectors and detectives
	'3359': ['33-9099'], // Regulatory government associate professionals nec
	'3361': ['17-3029', '13-1199'], // Air transport equipment project executive
	'3411': ['23-2011'], // Legal and related associate professionals → Paralegals
	'3412': ['21-1093', '21-1094'], // Social work associate professionals
	'3413': ['21-2099'], // Religious associate professionals
	'3421': ['27-1021', '27-2012'], // Athletes and sports players
	'3422': ['27-2022'], // Sports coaches, instructors
	'3423': ['39-9032'], // Fitness and recreation instructors
	'3431': ['27-4021'], // Photographers
	'3432': ['27-4011', '27-4012'], // Interior designers and decorators
	'3433': ['27-1025'], // Gallery, museum and library technicians
	'3434': ['27-2012', '27-2099'], // Chef de cuisine → use generic arts
	'3435': ['27-2099'], // Other artistic and cultural associate professionals
	// Singapore-specific 35xx - ICT technicians
	'3511': ['15-1231', '43-9011'], // Computer systems operators
	'3512': ['15-1231', '15-1232'], // IT infrastructure/security/support technicians
	'3514': ['15-1254', '15-1299'], // Website administrators
	'3521': ['27-4011', '27-4012'], // Media/broadcasting operations technicians
	'3522': ['49-2022'], // Telecommunications technicians
	// Singapore-specific 36xx - Education associate professionals
	'3610': ['25-2011', '25-2012'], // Pre-primary education teachers
	'3620': ['25-3099', '27-2099'], // Art/craft/IT/language/music instructors
	'3691': ['25-3099'], // Private tutors
	'3699': ['25-3099'], // Relief teachers
	// Singapore-specific 39xx
	'3991': ['21-2099'], // Non-ordained religious associate professionals

	// 4 — Clerical support workers
	'4000': ['43-1011'], // Office supervisors (SG-specific)
	'4110': ['43-9061'], // General office clerks
	'4120': ['43-4171'], // Secretaries (general) → Receptionists
	'4131': ['43-9111'], // Typists and word processing operators → Statistical Assistants
	'4132': ['43-9021', '43-9022'], // Data entry clerks
	'4211': ['43-3071'], // Bank tellers and related clerks
	'4212': ['43-3041', '43-3051'], // Bookmakers, croupiers → Gambling
	'4213': ['43-3031'], // Pawnbrokers and money-lenders → Bookkeeping clerks
	'4214': ['43-3031'], // Debt collectors and related workers
	'4221': ['39-6011', '39-6012'], // Travel consultants and clerks → Baggage/Concierges
	'4222': ['43-4051', '43-4171'], // Contact centre information clerks
	'4223': ['43-4121', '43-4131'], // Telephone switchboard operators
	'4224': ['39-6012', '43-4181'], // Hotel receptionists
	'4225': ['43-4151'], // Enquiry clerks
	'4226': ['43-4171'], // Receptionists (general)
	'4227': ['43-4041', '43-4051'], // Survey and market research interviewers
	'4229': ['43-4199'], // Client information workers nec
	'4311': ['43-3031'], // Accounting and bookkeeping clerks
	'4312': ['43-3021', '43-3051'], // Statistical, finance and insurance clerks
	'4313': ['43-3041'], // Payroll clerks → Gambling Cage Workers
	'4314': ['43-4111', '43-9111'], // Enumerators, market research interviewers
	'4315': ['43-9021', '43-9022'], // Data processing control clerks
	'4321': ['43-5071'], // Stock clerks
	'4322': ['43-5061', '43-5071'], // Production clerks
	'4323': ['43-5011', '43-5021'], // Transport clerks
	'4411': ['25-4031'], // Library clerks
	'4412': ['43-4071'], // Mail carriers and sorting clerks → Correspondence Clerks
	'4413': ['43-9071'], // Coding, proofreading and related clerks
	'4414': ['43-4151', '43-4161'], // Scribes and related workers
	'4415': ['43-9011'], // Filing and copying clerks → Computer Operators
	'4416': ['43-4151'], // Personnel clerks
	'4417': ['23-2011', '43-4181'], // Legal clerks
	'4419': ['43-9199'], // Clerical support workers nec

	// 5 — Service and sales workers
	'5111': ['39-6011', '39-6012'], // Travel attendants and travel stewards
	'5112': ['53-1041', '53-1042'], // Transport conductors
	'5113': ['39-7011', '39-7012'], // Travel guides
	'5120': ['35-1012', '35-2014'], // Cooks
	'5131': ['35-3011', '35-3021'], // Waiters and bartenders
	'5132': ['35-3041'], // Bartenders → Food Servers
	'5141': ['39-5011', '39-5012'], // Hairdressers
	'5142': ['39-5091', '39-5094'], // Beauticians and related workers
	'5149': ['31-9011', '39-5094'], // Masseurs, slimming consultants
	'5150': ['37-1011', '37-1012'], // Housekeepers, house stewards
	'5151': ['37-1011', '37-1012'], // Cleaning and housekeeping supervisors
	'5152': ['37-2011', '37-2012'], // Domestic housekeepers
	'5153': ['37-2011', '37-2012'], // Building caretakers
	'5161': ['33-9092'], // Astrologers, fortune-tellers
	'5162': ['39-4031'], // Companions and valets → Morticians
	'5163': ['39-1022', '39-9011'], // Undertakers and embalmers
	'5193': ['39-4031'], // Undertakers (SG-specific)
	'5194': ['39-2021'], // Keepers/trainers in zoological parks
	'5195': ['39-9031'], // Driving instructors/testers
	'5164': ['39-5093'], // Pet groomers and animal care workers
	'5165': ['39-9031'], // Driving instructors
	'5170': ['39-3012', '39-3019'], // Bookmakers, croupiers, casino dealers
	'5169': ['39-9099'], // Personal services workers nec
	'5211': ['41-2031'], // Stall and market salespersons → Retail Salespersons
	'5212': ['41-9091'], // Street food salespersons
	'5221': ['41-1011', '41-1012'], // Shop keepers
	'5222': ['41-2011', '41-2012'], // Shop supervisors
	'5220': ['41-1011', '41-2031'], // Sales supervisors, shop sales assistants
	'5223': ['41-2031'], // Shop sales assistants → Retail Salespersons
	'5230': ['41-2011'], // Cashiers and ticket clerks
	'5241': ['27-1021'], // Fashion and other models
	'5242': ['41-9012'], // Sales demonstrators → Models (actually should be demonstrators)
	'5243': ['41-9011'], // Door to door salespersons
	'5244': ['41-9041'], // Contact centre salespersons → Telemarketers
	'5245': ['41-3041'], // Service station attendants
	'5246': ['35-3023'], // Food service counter attendants
	'5249': ['41-9099'], // Sales workers nec
	'5311': ['39-9011'], // Child care workers
	'5312': ['25-9041'], // Teachers' aides
	'5321': ['31-1121', '31-1122'], // Health care assistants
	'5320': ['31-9091', '31-9092'], // Dental/healthcare/nursing aides
	'5322': ['31-1131', '31-1132'], // Home-based personal care workers
	'5329': ['31-9099'], // Health associate workers nec
	'5411': ['33-1011', '33-1012'], // Firefighters
	'5412': ['33-3011', '33-3012'], // Police officers
	'5413': ['33-3021'], // Prison guards → Detectives
	'5414': ['33-9032'], // Security guards
	'5415': ['33-9092'], // Lifeguards
	'5419': ['33-9099'], // Protective services workers nec

	// 6 — Skilled agricultural, forestry and fishery workers
	'6111': ['45-2011', '45-2091'], // Field crop and vegetable growers
	'6112': ['45-2092', '45-2093'], // Tree and shrub crop growers
	'6113': ['45-2011'], // Gardeners, horticultural and nursery growers
	'6114': ['45-2093'], // Mixed crop growers
	'6121': ['45-2021'], // Livestock and dairy producers → Animal Breeders
	'6122': ['45-2093'], // Poultry producers
	'6123': ['45-2093'], // Apiarists and sericulturists
	'6129': ['45-2099'], // Animal producers nec
	'6130': ['45-2011', '45-2021'], // Mixed crop and animal producers
	'6210': ['45-4011', '45-4021'], // Forestry and related workers
	'6221': ['45-3011'], // Aquaculture workers → Fishers and Related Fishing Workers
	'6222': ['45-3011'], // Inland and coastal waters fishery workers
	'6223': ['45-3031'], // Deep-sea fishery workers
	'6224': ['45-3011'], // Hunters and trappers

	// 7 — Craft and related trades workers
	'7100': ['47-1011'], // Supervisor/General foreman (building trades)
	'7111': ['47-2021', '47-2031'], // House builders
	'7112': ['47-2021'], // Bricklayers and related workers
	'7113': ['47-2051', '47-2053'], // Stonemasons, stone cutters
	'7114': ['47-2061', '47-2071'], // Concrete placers, finishers
	'7115': ['47-2031'], // Carpenters and joiners
	'7119': ['47-2099'], // Building frame workers nec
	'7121': ['47-2131', '47-2141'], // Roofers
	'7122': ['47-2043', '47-2044'], // Floor layers and tile setters
	'7123': ['47-2141', '47-2142'], // Plasterers
	'7124': ['47-2151', '47-2152'], // Insulation workers
	'7125': ['47-2121'], // Glaziers
	'7126': ['47-2151', '47-2152'], // Plumbers and pipe fitters
	'7127': ['47-2211', '47-2221'], // Air conditioning and refrigeration mechanics
	'7131': ['27-1013'], // Painters and related workers → Fine Artists
	'7132': ['51-9124'], // Spray painters and varnishers → Jewelers
	'7133': ['47-4099'], // Building structure cleaners
	'7200': ['51-1011'], // Supervisor/General foreman (metal, machinery trades)
	'7211': ['51-4111'], // Metal moulders and coremakers → Tool and Die Makers
	'7212': ['51-4121'], // Welders and flamecutters
	'7213': ['47-2171', '47-2181'], // Sheet-metal workers
	'7214': ['51-4199'], // Structural-metal preparers and erectors
	'7215': ['51-4031'], // Riggers and cable splicers → Cutting/Punching Machine Operators
	'7221': ['51-4041'], // Blacksmiths, hammersmiths → Machinists
	'7222': ['51-4111'], // Toolmakers and related workers
	'7223': ['51-4031', '51-4034'], // Metal working machine tool setters and operators
	'7224': ['51-4035'], // Metal polishers, wheel grinders → Milling/Planing Machine Operators
	'7231': ['49-3023'], // Motor vehicle mechanics and repairers → Automotive Service Technicians
	'7232': ['49-3011'], // Aircraft engine mechanics and repairers
	'7233': ['49-3042', '49-3043'], // Agricultural and industrial machinery mechanics
	'7234': ['49-3051'], // Bicycle and related repairers → Motorboat Mechanics
	'7239': ['49-9041', '49-9043'], // Industrial/office machinery mechanics
	'7300': ['51-1011'], // Supervisor (precision, handicraft, printing trades)
	'7311': ['51-9071'], // Precision-instrument makers and repairers
	'7312': ['51-9071'], // Musical instrument makers and tuners
	'7313': ['51-9071', '51-9195'], // Jewellery and precious-metal workers
	'7314': ['51-9195'], // Potters and related workers → Molders
	'7315': ['51-9195'], // Glass makers, cutters, grinders → Molders
	'7316': ['51-5111', '51-5112'], // Sign writers, decorative painters
	'7317': ['27-1012', '51-9071'], // Handicraft workers in wood, basketry
	'7318': ['51-9199'], // Handicraft workers in textile, leather
	'7319': ['51-9199'], // Handicraft workers nec
	'7321': ['51-5111', '51-5112'], // Pre-press technicians
	'7322': ['51-5111', '51-5112'], // Printers
	'7323': ['51-5113'], // Print finishing and binding workers → Bookbinders
	'7400': ['49-1011'], // Lift supervisor, electrical trades supervisor
	'7411': ['47-2111'], // Building and related electricians → Electricians
	'7412': ['49-2022'], // Electrical mechanics and fitters → Telecommunications Line Installers
	'7413': ['49-9051', '49-9052'], // Electrical line installers and repairers
	'7421': ['49-2021', '49-2022'], // Electronics mechanics and servicers
	'7422': ['15-1232', '49-2011'], // ICT installers and servicers → Computer Network Support
	'7500': ['51-1011'], // Supervisor (food processing, woodworking, garment trades)
	'7511': ['51-3011', '51-3021'], // Butchers, fishmongers
	'7512': ['51-3011'], // Bakers, pastry-cooks
	'7513': ['51-3092', '51-3093'], // Dairy-products makers
	'7514': ['51-3099'], // Fruit, vegetable and related preservers
	'7515': ['51-9012'], // Food and beverage tasters and graders
	'7516': ['51-3099'], // Tobacco preparers and tobacco products makers
	'7521': ['51-6041', '51-6042'], // Wood treaters
	'7522': ['51-7011', '51-7041'], // Cabinet-makers and related workers
	'7523': ['51-7042'], // Woodworking-machine tool setters and operators
	'7531': ['51-6041', '51-6042'], // Tailors, dressmakers, furriers
	'7532': ['51-6052'], // Pattern-makers and cutters (fabric/leather)
	'7533': ['51-6031'], // Sewing, embroidery and related workers → Sewing Machine Operators
	'7534': ['51-6099'], // Upholsterers and related workers
	'7535': ['51-6099'], // Pelt dressers, tanners and fellmongers
	'7536': ['51-6041'], // Shoemakers and related workers
	'7541': ['53-7021'], // Underwater divers → Crane Operators
	'7542': ['47-2051', '47-2073'], // Shotfirers and blasters
	'7543': ['19-4099'], // Product graders and testers (except foods and beverages)
	'7544': ['49-9098'], // Fumigators and other pest controllers → Helpers
	'7549': ['51-9199'], // Craft and related workers nec

	// 8 — Plant and machine operators, and assemblers
	'8100': ['51-1011'], // Stationary plant and machine supervisor
	'8111': ['47-5041', '47-5042'], // Miners and quarriers
	'8112': ['47-5013'], // Mineral and stone processing plant operators
	'8113': ['47-5011', '47-5012'], // Well drillers and borers → Derrick Operators
	'8114': ['51-9023'], // Cement, stone and other mineral products machine operators
	'8121': ['51-9011'], // Metal processing plant operators → Chemical Processing Machine Operators
	'8122': ['51-4051', '51-4052'], // Metal finishing, plating and coating machine operators
	'8125': ['51-4031', '51-4034'], // Metalworking/precision grinding machine operators
	'8131': ['51-9011', '51-9012'], // Chemical products plant and machine operators
	'8132': ['51-9111', '51-9121'], // Photographic products machine operators
	'8141': ['51-9041'], // Rubber products machine operators → Extruding Machine Operators
	'8142': ['51-9111'], // Plastic products machine operators → Packaging Machine Operators
	'8143': ['51-6091'], // Paper products machine operators → Extruding/Forming Machine Operators
	'8150': ['51-6031'], // Sewing machine operators (SG-specific)
	'8151': ['51-6061', '51-6062'], // Fibre preparing, spinning and winding machine operators
	'8152': ['51-6063'], // Weaving and knitting machine operators
	'8153': ['51-6031'], // Sewing machine operators
	'8154': ['51-6093'], // Bleaching, dyeing and fabric cleaning machine operators
	'8155': ['51-6099'], // Fur and leather preparing machine operators
	'8156': ['51-6041', '51-6042'], // Shoemaking and related machine operators
	'8157': ['51-6099'], // Laundry machine operators
	'8159': ['51-6099'], // Textile, fur and leather products machine operators nec
	'8160': ['51-3091', '51-3092', '51-3093'], // Food and related products machine operators
	'8171': ['51-4199'], // Pulp and papermaking plant operators
	'8172': ['51-7042'], // Wood processing plant operators
	'8181': ['51-9195'], // Glass and ceramics plant operators
	'8182': ['51-8021'], // Steam engine and boiler operators → Stationary Engineers
	'8183': ['51-9111', '51-9121'], // Packing, bottling and labelling machine operators
	'8184': ['51-5111', '51-5112'], // Printing machine operators
	'8189': ['51-9199'], // Stationary plant and machine operators nec
	'8200': ['51-1011'], // Supervisor of assemblers and quality checkers
	'8211': ['51-2011', '51-2091'], // Mechanical machinery assemblers
	'8212': ['51-2021', '51-2022', '51-2023'], // Electrical and electronic equipment assemblers
	'8213': ['51-9061', '51-9199'], // Mechanical products quality checkers/testers
	'8219': ['51-2099'], // Assemblers nec
	'8300': ['53-1041', '53-1042'], // Mobile machinery supervisor
	'8311': ['53-4011', '53-4013'], // Locomotive engine drivers
	'8312': ['53-4031', '53-4041'], // Railway brake, signal and switch operators
	'8321': ['53-3031', '53-3032'], // Motorcycle drivers → Bus/Transit Drivers
	'8322': ['53-3041', '53-3053'], // Car, taxi and van drivers
	'8331': ['53-3032', '53-3033'], // Bus and tram drivers
	'8332': ['53-3031', '53-3032'], // Heavy truck and lorry drivers → Bus Drivers
	'8341': ['53-5022'], // Mobile farm and forestry plant operators → Motorboat Operators
	'8342': ['53-7021', '53-7031'], // Earthmoving and related plant operators
	'8343': ['53-7041', '53-7051'], // Crane, hoist and related plant operators
	'8344': ['53-7061', '53-7062'], // Lifting truck operators
	'8349': ['53-7051', '53-7199'], // Airport mobile equipment operators
	'8350': ['53-5011', '53-5021'], // Ships' deck crews and related workers

	// 9 — Elementary occupations
	'9100': ['37-1011', '37-1012'], // Cleaning supervisors (SG-specific)
	'9111': ['35-9011', '35-9021'], // Domestic cleaners and helpers
	'9112': ['37-2011', '37-2012'], // Cleaners and helpers in offices, hotels
	'9113': ['37-2011', '37-2012'], // Office/commercial/industrial cleaners
	'9115': ['35-9021', '37-2012'], // Dishwashers, F&B cleaners
	'9116': ['37-2011', '37-3011'], // Residential and open areas cleaners
	'9121': ['53-7061'], // Hand launderers and pressers
	'9122': ['53-7064'], // Vehicle cleaners → Packers
	'9123': ['37-3011', '37-3013'], // Window cleaners
	'9129': ['37-2019'], // Other cleaning workers
	'9211': ['45-2092', '45-2093'], // Crop farm labourers
	'9212': ['45-2093'], // Livestock farm labourers
	'9213': ['45-2093'], // Mixed crop and livestock farm labourers
	'9214': ['37-3011', '37-3012'], // Garden and horticultural labourers
	'9215': ['45-4022', '45-4023'], // Forestry labourers
	'9216': ['45-3011'], // Fishery and aquaculture labourers
	'9310': ['47-3011', '47-3013'], // Civil engineering/building construction labourers
	'9311': ['47-5099'], // Mining and quarrying labourers
	'9312': ['47-3011', '47-3012'], // Civil engineering labourers → Helpers
	'9313': ['47-3013', '47-3014'], // Building construction labourers
	'9320': ['53-7062', '53-7064'], // Hand packers (SG-specific)
	'9321': ['53-7061', '53-7062'], // Hand packers
	'9329': ['51-9198', '51-9199'], // Manufacturing labourers nec
	'9331': ['53-7062'], // Hand and pedal vehicle drivers → Packers/Packagers
	'9332': ['53-3033'], // Drivers of animal-drawn vehicles → Truck Drivers
	'9333': ['53-7062'], // Freight handlers
	'9334': ['53-7062', '53-7064'], // Shelf fillers
	'9410': ['35-2021', '35-9031'], // Fast food preparers, kitchen assistants
	'9411': ['35-2021', '35-9031'], // Fast food preparers → Food Preparation Workers
	'9412': ['35-2021'], // Kitchen helpers
	'9510': ['41-9091'], // Street and related service workers
	'9520': ['41-9091'], // Street vendors (non-food)
	'9611': ['53-7081'], // Garbage and recycling collectors → Refuse collectors
	'9612': ['47-4099'], // Refuse sorters
	'9613': ['37-3019'], // Sweepers and related labourers
	'9621': ['43-5021', '43-5051'], // Messengers, package deliverers → Mail Clerks
	'9622': ['53-7062'], // Odd job persons
	'9623': ['43-5021'], // Meter readers and vending-machine collectors
	'9624': ['53-7062'], // Water and firewood collectors
	'9625': ['39-3091', '39-9099'], // Bus/car park/hospital/library attendants
	'9626': ['37-2011', '33-9032'], // Building caretakers, watchmen, doormen
	'9627': ['39-6012'], // Concierges (hotel)
	'9629': ['53-7199'] // Elementary workers nec
};

export const SOC_TO_ISCO: Record<string, string[]> = Object.entries(ISCO_TO_SOC).reduce(
	(acc, [isco, socs]) => {
		for (const soc of socs) {
			const bucket = acc[soc] ?? [];
			if (!bucket.includes(isco)) bucket.push(isco);
			acc[soc] = bucket;
		}
		return acc;
	},
	{} as Record<string, string[]>
);

/**
 * Convert a 5-digit SSOC code to a 4-digit ISCO-08 unit group.
 * SSOC is based on ISCO-08: first 4 digits of SSOC = ISCO-08 unit group.
 * Some SSOC codes have a 5th digit for Singapore-specific detail.
 */
export function ssocToIsco(ssoc: string): string {
	return ssoc.substring(0, 4);
}

/**
 * Given an ISCO-08 unit group, return the matching SOC 2010 codes.
 * Returns empty array if no mapping found.
 */
export function iscoToSoc(isco: string): string[] {
	return ISCO_TO_SOC[isco] || [];
}

/**
 * Return all ISCO-08 unit groups that map to a SOC 2010 code.
 */
export function socToIscoCodes(soc: string): string[] {
	return SOC_TO_ISCO[soc] || [];
}

/**
 * Return the best ISCO-08 unit group for a SOC 2010 code.
 * If multiple candidates exist, the first published crosswalk entry wins.
 */
export function socToIsco(soc: string): string | null {
	return SOC_TO_ISCO[soc]?.[0] ?? null;
}

/**
 * Build the full crosswalk chain: SSOC → ISCO → SOC codes.
 */
export function ssocToSocCodes(ssoc: string): string[] {
	const isco = ssocToIsco(ssoc);
	return iscoToSoc(isco);
}

/**
 * For fallback: get 2-digit ISCO sub-major group from a 4-digit ISCO code.
 */
export function iscoSubMajorGroup(isco: string): string {
	return isco.substring(0, 2);
}

/**
 * Get all SOC codes that map to any ISCO code starting with the given prefix.
 */
export function socCodesForIscoPrefix(prefix: string): string[] {
	const codes: string[] = [];
	for (const [isco, socs] of Object.entries(ISCO_TO_SOC)) {
		if (isco.startsWith(prefix)) {
			codes.push(...socs);
		}
	}
	return [...new Set(codes)];
}
