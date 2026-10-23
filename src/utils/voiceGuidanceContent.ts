// JalRakshak — Voice Guidance Content Generator
// Provides accurate, dynamic, and honest bilingual (English & Hindi) narration scripts
// reflecting real application state, route context, and data disclaimers.

import type { MetricSummary, Incident, RoutePlan } from '../data/types';
import { getIncidentById } from '../data/store';
import type { LanguageCode } from './speech';

export type NarrationMode = 'overview' | 'insights' | 'controls';

export interface PageGuidance {
  pageTitle: { en: string; hi: string };
  overview: { en: string; hi: string };
  insights: { en: string; hi: string };
  controls: { en: string; hi: string };
}

interface GuidanceContext {
  pathname: string;
  metrics: MetricSummary;
  incidents: Incident[];
  routes: RoutePlan[];
}

export function generatePageGuidance(ctx: GuidanceContext): PageGuidance {
  const { pathname, metrics, incidents, routes } = ctx;

  // 1. Landing Page (/)
  if (pathname === '/' || pathname === '') {
    return {
      pageTitle: {
        en: 'Landing Page — Delhi Monsoon Road Intelligence',
        hi: 'होम पेज — दिल्ली मानसून रोड इंटेलिजेंस',
      },
      overview: {
        en: 'Welcome to JalRakshak, Delhi\'s monsoon road intelligence platform. JalRakshak unmasks hidden road hazards by cross-referencing pre-monsoon dry season defect records with active rainfall waterlogging across Delhi\'s arterial roads. All displayed information is demonstration data.',
        hi: 'जल रक्षक में आपका स्वागत है — यह दिल्ली मानसून रोड इंटेलिजेंस प्लेटफ़ॉर्म है। जल रक्षक प्री-मानसून में दर्ज किए गए गड्ढों और सड़क क्षति को बारिश के जलभराव से जोड़कर पानी के नीचे छिपे खतरों की पहचान करता है। यहाँ प्रदर्शित सभी आंकड़े प्रदर्शन डेमो डेटा हैं।',
      },
      insights: {
        en: 'During heavy monsoon cloudbursts, deep potholes along corridors like Mathura Road and Minto Bridge become completely invisible beneath muddy standing floodwater. JalRakshak uses spatial-temporal correlation to predict submerged cavities before two-wheeler riders hit them. It also provides SafeRoute, recommending lower-risk routes over flooded direct roads.',
        hi: 'भारी मानसून के दौरान मथुरा रोड और मिंटो ब्रिज जैसे मार्गों पर गहरे गड्ढे मटमैले पानी के नीचे छिप जाते हैं। जल रक्षक यात्रियों के पहुँचने से पहले ही छिपे खतरों का अनुमान लगाता है और सेफ़ रूट के ज़रिये कम जोखिम वाले रास्ते सुझाता है।',
      },
      controls: {
        en: 'To navigate, select "Open Command Center" to view the geospatial hazard map, or select "Explore SafeRoute" to plan a safer corridor trip. You can scroll down to explore our five-part technical narrative and the four Delhi monument surveillance sectors.',
        hi: 'आगे बढ़ने के लिए "ओपन कमांड सेंटर" बटन दबाकर मैप देखें, या "एक्सप्लोर सेफ़ रूट" चुनकर सुरक्षित मार्ग चुनें। नीचे स्क्रॉल करके आप पाँच चरणों की तकनीकी व्याख्या और चारों दिल्ली स्मारकों के निगरानी क्षेत्र देख सकते हैं।',
      },
    };
  }

  // 2. Dashboard (/dashboard)
  if (pathname.startsWith('/dashboard')) {
    const criticalCount = metrics.criticalAlerts;
    const waterlogCount = metrics.activeWaterlogging;
    const hiddenCount = metrics.hiddenHazards;
    const totalCount = metrics.totalHazards;

    return {
      pageTitle: {
        en: 'Command Center — Delhi Hazard Map',
        hi: 'कमांड सेंटर — दिल्ली आपदा मानचित्र',
      },
      overview: {
        en: `Command Center: Currently monitoring ${totalCount} road records across Delhi, including ${waterlogCount} active waterlogged zones and ${hiddenCount} inferred potential hidden hazards. All data is synthetic demonstration data.`,
        hi: `कमांड सेंटर: इस समय दिल्ली के मुख्य मार्गों पर कुल ${totalCount} सड़क रिकॉर्ड्स मॉनिटर हो रहे हैं, जिनमें ${waterlogCount} सक्रिय जलभराव क्षेत्र और पानी के नीचे छिपे ${hiddenCount} अनुमानित खतरे शामिल हैं। यह सभी आंकड़े डेमो डेटा हैं।`,
      },
      insights: {
        en: `There are ${criticalCount} critical severity hazards requiring immediate commuter attention. Potential hidden hazards represent statistical intersections of dry-season defect surveys with current flooding; they are inferred predictions, not physically confirmed by divers. Data freshness ranges from recent hours to historical surveys.`,
        hi: `इस समय ${criticalCount} अति-गंभीर खतरे सक्रिय हैं जहाँ अतिरिक्त सतर्कता ज़रूरी है। पानी में छिपे खतरे सूखे मौसम के बेसलाइन सर्वे और वर्तमान जलभराव के गणितीय मिलान पर आधारित हैं; यह गोताखोरों द्वारा सीधे सत्यापित नहीं हैं।`,
      },
      controls: {
        en: 'Use the category filter buttons above the map to filter by Pothole, Open Manhole, or Waterlogging. Click any interactive marker on the map to inspect location telemetry, severity badges, and municipal verification status. Use the tabs on the right to toggle between the live incident feed and hidden hazard predictions.',
        hi: 'मैप के ऊपर दिए गए फ़िल्टर बटनों से गड्ढा, खुला मैनहोल या जलभराव चुन सकते हैं। मैप पर किसी भी मार्कर पर क्लिक करके स्थान और गंभीरता की जानकारी देखें। दाईं ओर आप इंसिडेंट फ़ीड और छिपे खतरों की सूची बदल सकते हैं।',
      },
    };
  }

  // 3. SafeRoute (/safe-route)
  if (pathname.startsWith('/safe-route')) {
    const defaultRouteCount = routes.length > 0 ? routes[0].routes.length : 2;
    return {
      pageTitle: {
        en: 'SafeRoute — Dynamic Risk Navigation',
        hi: 'सेफ़ रूट — डायनामिक रिस्क नेविगेशन',
      },
      overview: {
        en: `SafeRoute evaluates alternative corridors by cross-referencing pre-monsoon road defects, active waterlogging depth, and spatial confidence. It recommends routes with lower reported hazard risk rather than raw shortest distance. Route risk scores are illustrative demonstration calculations.`,
        hi: `सेफ़ रूट नेविगेशन केवल कम समय या कम दूरी देखने के बजाय सड़क पर पानी के भराव, छिपे गड्ढों और रिपोर्ट की प्रामाणिकता के आधार पर सुरक्षित मार्ग की सिफारिश करता है। यह रिस्क स्कोर प्रदर्शन डेमो गणनाएं हैं।`,
      },
      insights: {
        en: `SafeRoute currently compares ${defaultRouteCount} routes per corridor pair across three supported pairs: Connaught Place to Lajpat Nagar, ITO to Connaught Place, and ITO to Lajpat Nagar. For example, between Connaught Place and Lajpat Nagar, taking the elevated Barapullah bypass adds roughly 5 minutes but reduces route risk by over 60 percent compared to flooded Mathura Road.`,
        hi: `सेफ़ रूट तीन मुख्य कॉरिडोर जोड़ियों की तुलना करता है: कनॉट प्लेस से लाजपत नगर, आईटीओ से कनॉट प्लेस, और आईटीओ से लाजपत नगर। उदाहरण के लिए, बारापुला एलिवेटेड बाईपास लेने पर केवल 5 मिनट अधिक लगते हैं लेकिन बाढ़ भरे मथुरा रोड की तुलना में जोखिम 60 प्रतिशत से अधिक कम हो जाता है।`,
      },
      controls: {
        en: 'Use the Origin Point and Destination Point dropdown menus to choose your journey. Use the Swap button to invert origin and destination. Click any route comparison card to display its schematic corridor and hazard pins on the map.',
        hi: 'ड्रॉपडाउन से अपना प्रस्थान और गंतव्य स्थान चुनें। दोनों स्थानों को आपस में बदलने के लिए "स्वैप" बटन दबाएं। दूरी, समय और जोखिम स्कोर वाले कार्ड्स देखें और मैप पर मार्ग देखने के लिए किसी भी कार्ड पर क्लिक करें।',
      },
    };
  }

  // 4. Road Intelligence (/road-intelligence)
  if (pathname.startsWith('/road-intelligence')) {
    const historicalCount = incidents.filter(i => i.isHistorical).length;
    const activeCount = incidents.filter(i => i.isActive).length;

    return {
      pageTitle: {
        en: 'Road Intelligence — Evidence Ledger',
        hi: 'रोड इंटेलिजेंस — साक्ष्य लेज़र',
      },
      overview: {
        en: `Road Intelligence Registry: An evidence-oriented audit ledger tracking ${incidents.length} total road infrastructure records, including ${historicalCount} dry-season pre-monsoon baseline defects and ${activeCount} active monsoon reports.`,
        hi: `रोड इंटेलिजेंस लेज़र: इसमें कुल ${incidents.length} सड़कों का विवरण है, जिनमें ${historicalCount} सूखे मौसम के प्री-मानसून बेसलाइन गड्ढे और ${activeCount} बारिश के सक्रिय जलभराव रिकॉर्ड शामिल हैं।`,
      },
      insights: {
        en: 'This ledger clearly distinguishes historical road defects from current active flooding. Historical baseline records establish ground truth before monsoon rains begin. Each record shows its verification status, indicating whether it was submitted by community members or verified by field inspection.',
        hi: 'यह लेज़र सूखे मौसम के पुराने गड्ढों और वर्तमान बारिश की घटनाओं में स्पष्ट अंतर करता है। प्री-मानसून रिकॉर्ड्स बारिश शुरू होने से पहले की ज़मीनी स्थिति दर्ज करते हैं, और वेरिफिकेशन टैग बताता है कि रिपोर्ट जांची गई है या नहीं।',
      },
      controls: {
        en: 'Use the search bar to locate specific Delhi roads such as Ring Road, Mathura Road, or Minto Bridge. Filter by category or verification status using the dropdown filters. Click any row in the table to open detailed evidence, inspection notes, and status timeline.',
        hi: 'सर्च बार में सड़क या इलाके का नाम लिखकर खोजें। फ़िल्टर द्वारा श्रेणी चुनें। किसी भी पंक्ति पर क्लिक करके उसकी पूरी टाइमलाइन, स्थिति का इतिहास और सत्यापन विकल्प देख सकते हैं।',
      },
    };
  }

  // 5. Report Hazard (/report)
  if (pathname.startsWith('/report')) {
    return {
      pageTitle: {
        en: 'Report Hazard — Citizen Contribution',
        hi: 'खतरे की रिपोर्ट — नागरिक भागीदारी',
      },
      overview: {
        en: 'Citizen Hazard Reporting Portal: Commuters can report potholes, open manholes, and waterlogged stretches to warn fellow riders. Safety reminder: Please report only when safely stopped. Never use your phone while riding or driving.',
        hi: 'नागरिक आपदा रिपोर्टिंग पोर्टल: यहाँ नागरिक सड़क पर गड्ढे, खुले मैनहोल या जलभराव की रिपोर्ट दर्ज कर सकते हैं। सुरक्षा नियम: वाहन चलाते समय कभी भी फ़ोन का उपयोग न करें; सुरक्षित रुकने के बाद ही रिपोर्ट करें।',
      },
      insights: {
        en: 'In this browser prototype, your report is saved locally in browser storage and will immediately update the local dashboard and map. This demo does not automatically transmit data to municipal government authorities or emergency services.',
        hi: 'इस डेमो प्रोटोटाइप में दर्ज की गई रिपोर्ट आपके ब्राउज़र में सुरक्षित होती है और स्थानीय डैशबोर्ड व मैप को तुरंत अपडेट करती है। यह सीधे सरकारी विभागों या आपातकालीन सेवाओं को नहीं भेजी जाती।',
      },
      controls: {
        en: 'Fill in the required fields: First, choose the Hazard Category. Second, provide the Road Name and Area Landmark. Third, select the Severity level from Low to Critical. Fourth, enter a descriptive note. Then click "Review & Submit Report" to complete submission.',
        hi: 'फ़ॉर्म भरने के चरण: पहले खतरे की श्रेणी चुनें। दूसरा, सड़क का नाम और नज़दीकी लैंडमार्क लिखें। तीसरा, गंभीरता (लो, मीडियम, हाई या क्रिटिकल) चुनें। चौथा, विवरण लिखें और "रिव्यू एंड सबमिट" बटन दबाएं।',
      },
    };
  }

  // 6. Incident Details (/incidents/:id)
  if (pathname.startsWith('/incidents/')) {
    const id = pathname.split('/')[2];
    const incident = id ? getIncidentById(id) : undefined;

    if (!incident) {
      return {
        pageTitle: {
          en: 'Incident Record Not Found',
          hi: 'घटना रिकॉर्ड नहीं मिला',
        },
        overview: {
          en: `Incident with ID ${id || 'unknown'} could not be found in the current store. Please return to Road Intelligence or Dashboard.`,
          hi: `आईडी ${id || 'अज्ञात'} वाला रिकॉर्ड नहीं मिला। कृपया रोड इंटेलिजेंस या डैशबोर्ड पर वापस जाएं।`,
        },
        insights: {
          en: 'The requested record does not exist or may have been cleared from local storage.',
          hi: 'यह रिकॉर्ड मौजूद नहीं है या ब्राउज़र मेमोरी से हट चुका है।',
        },
        controls: {
          en: 'Click "Back to Road Intelligence" to return to the full ledger.',
          hi: '"वापस जाएं" बटन दबाकर मुख्य सूची पर लौटें।',
        },
      };
    }

    const isHistorical = incident.isHistorical;
    const category = incident.category.replace('_', ' ');
    const severity = incident.severity;
    const road = incident.location.road;
    const area = incident.location.area;
    const status = incident.status.replace('_', ' ');
    const verification = incident.verification;

    return {
      pageTitle: {
        en: `Incident #${incident.id} — ${incident.title}`,
        hi: `घटना #${incident.id} — ${incident.title}`,
      },
      overview: {
        en: `Incident ${incident.id}: ${incident.title}. Category is ${category}. Location: ${road}, ${area}. Severity is ${severity}. Current workflow status is ${status}. Municipal verification is ${verification}.`,
        hi: `घटना ${incident.id}: ${incident.title}। श्रेणी ${category} है। स्थान: ${road}, ${area}। गंभीरता ${severity} है। वर्तमान स्थिति ${status} और सत्यापन ${verification} है।`,
      },
      insights: {
        en: `${isHistorical ? 'This is a pre-monsoon baseline defect surveyed during dry weather.' : 'This is an active monsoon incident.'} Description: ${incident.description}. All incident details shown are synthetic demonstration records.`,
        hi: `${isHistorical ? 'यह सूखे मौसम का प्री-मानसून बेसलाइन गड्ढा है।' : 'यह बारिश के मौसम की सक्रिय घटना है।'} विवरण: ${incident.description}। यह सभी आंकड़े डेमो रिकॉर्ड हैं।`,
      },
      controls: {
        en: 'You can update the demo review status using the status selector, or toggle verification status. Use the "Back to Road Intelligence" link to return to the list.',
        hi: 'आप डेमो स्टेटस सिलेक्टर से स्थिति बदल सकते हैं, या वेरिफिकेशन बदल सकते हैं। मुख्य सूची पर लौटने के लिए वापस जाने वाला लिंक दबाएं।',
      },
    };
  }

  // 7. Maintenance (/maintenance)
  if (pathname.startsWith('/maintenance')) {
    const underReview = incidents.filter(i => i.status === 'forwarded_for_review').length;
    const repaired = incidents.filter(i => i.status === 'repair_reported' || i.status === 'resolution_verified').length;

    return {
      pageTitle: {
        en: 'Maintenance & Municipal Workflow',
        hi: 'रखरखाव एवं नगर निगम कार्यप्रवाह',
      },
      overview: {
        en: `Maintenance Operations: Illustrating a five-stage resolution pipeline: Reported, Under Verification, Forwarded for Review, Repair Reported, and Resolution Verified. Currently ${underReview} incidents are marked for review, and ${repaired} have repair progress recorded.`,
        hi: `रखरखाव कार्यप्रवाह: यह पाँच चरणों की प्रक्रिया दिखाता है: रिपोर्टेड, सत्यापन अधीन, समीक्षा हेतु प्रेषित, मरम्मत रिपोर्टेड, और समाधान सत्यापित। वर्तमान में ${underReview} रिपोर्ट समीक्षा में हैं।`,
      },
      insights: {
        en: 'Proposed Municipal Integration: This page models how crowdsourced civic reports could seamlessly interface with municipal agencies like PWD, MCD, and NDMC. In this browser demonstration, no actual government submissions or dispatch calls occur.',
        hi: 'प्रस्तावित नगर निगम एकीकरण: यह पृष्ठ दिखाता है कि कैसे नागरिक रिपोर्ट लोक निर्माण विभाग (PWD) और नगर निगम (MCD) से जुड़ सकती हैं। इस डेमो में कोई वास्तविक सरकारी सबमिशन नहीं होता।',
      },
      controls: {
        en: 'Review the interactive lifecycle diagram at the top. In the incident table below, you can click action buttons such as "Mark Under Verification" or "Forward for Review" to simulate advancing an incident through the municipal handover pipeline.',
        hi: 'ऊपर दिए गए जीवनचक्र आरेख को देखें। नीचे दी गई तालिका में एक्शन बटन दबाकर आप किसी भी घटना की स्थिति को आगे बढ़ाकर प्रक्रिया का परीक्षण कर सकते हैं।',
      },
    };
  }

  // Fallback
  return {
    pageTitle: {
      en: 'JalRakshak — Delhi Monsoon Road Intelligence',
      hi: 'जल रक्षक — दिल्ली मानसून रोड इंटेलिजेंस',
    },
    overview: {
      en: 'JalRakshak provides road intelligence connecting pre-monsoon road defects with active waterlogging across Delhi.',
      hi: 'जल रक्षक दिल्ली की सड़कों पर पुराने गड्ढों और बारिश के जलभराव को जोड़कर सुरक्षा जानकारी प्रदान करता है।',
    },
    insights: {
      en: 'All data shown is synthetic demonstration data.',
      hi: 'प्रदर्शित सभी आंकड़े प्रदर्शन डेमो डेटा हैं।',
    },
    controls: {
      en: 'Use the navigation bar to visit the Command Center, SafeRoute, or Report a Hazard.',
      hi: 'कमांड सेंटर, सेफ़ रूट या रिपोर्ट पेज पर जाने के लिए नेविगेशन बार का उपयोग करें।',
    },
  };
}

export function getScriptForMode(
  guidance: PageGuidance,
  mode: NarrationMode,
  lang: LanguageCode
): string {
  const content = guidance[mode];
  return content[lang] || content['en'];
}
