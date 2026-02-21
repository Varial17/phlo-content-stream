export type Channel = 'linkedin' | 'threads' | 'email';
export type PostStatus = 'published' | 'approved' | 'pending' | 'draft';
export type Angle = 'Educational' | 'Opinion' | 'Case Study' | 'Trending' | 'Story';

export interface Post {
  id: string;
  hook: string;
  body?: string;
  channel: Channel;
  status: PostStatus;
  date: string;
  time: string;
  engagements?: number;
  impressions?: number;
  linkClicks?: number;
}

export interface Idea {
  id: string;
  hook: string;
  angle: Angle;
  channel: Channel | 'linkedin+threads';
  relevance: number;
  talkingPoints: string[];
}

export const calendarPosts: Post[] = [
  { id: '1', hook: '3 things every SMSF trustee needs to know before June 30', channel: 'linkedin', status: 'published', date: '2026-02-02', time: '9:00 AM', impressions: 1240, engagements: 87, linkClicks: 23 },
  { id: '2', hook: 'Why the ATO\'s new reporting rules are actually good news', channel: 'linkedin', status: 'published', date: '2026-02-03', time: '10:00 AM', impressions: 980, engagements: 64, linkClicks: 18 },
  { id: '3', hook: 'EOFY checklist: what your clients should be doing now', channel: 'email', status: 'published', date: '2026-02-04', time: '7:30 AM', impressions: 2100, engagements: 156, linkClicks: 45 },
  { id: '4', hook: 'The one conversation every accountant avoids', channel: 'threads', status: 'published', date: '2026-02-05', time: '12:00 PM', impressions: 760, engagements: 42, linkClicks: 11 },
  { id: '5', hook: 'Trust distributions explained in plain English (finally)', channel: 'linkedin', status: 'published', date: '2026-02-07', time: '9:00 AM', impressions: 1580, engagements: 103, linkClicks: 29 },
  { id: '6', hook: 'We helped a client save $40K in tax. Here\'s how.', channel: 'linkedin', status: 'published', date: '2026-02-10', time: '9:00 AM', impressions: 2340, engagements: 187, linkClicks: 52 },
  { id: '7', hook: 'Fringe benefits tax season: what\'s changed', channel: 'email', status: 'published', date: '2026-02-11', time: '7:30 AM', impressions: 1890, engagements: 98, linkClicks: 31 },
  { id: '8', hook: 'The myth of the \'set and forget\' investment portfolio', channel: 'threads', status: 'published', date: '2026-02-12', time: '11:00 AM', impressions: 890, engagements: 55, linkClicks: 14 },
  { id: '9', hook: 'What the RBA\'s decision means for your clients\' cash flow', channel: 'linkedin', status: 'approved', date: '2026-02-17', time: '9:00 AM' },
  { id: '10', hook: 'Why every accounting firm should post on LinkedIn', channel: 'linkedin', status: 'approved', date: '2026-02-18', time: '10:00 AM' },
  { id: '11', hook: 'Client spotlight: How proactive advice changed everything', channel: 'email', status: 'approved', date: '2026-02-19', time: '7:30 AM' },
  { id: '12', hook: '5 tax deductions your small business clients are missing', channel: 'threads', status: 'approved', date: '2026-02-20', time: '12:00 PM' },
  { id: '13', hook: 'How to talk to clients about succession planning', channel: 'linkedin', status: 'pending', date: '2026-02-23', time: '9:00 AM' },
  { id: '14', hook: 'The accounting industry\'s biggest opportunity in 2026', channel: 'linkedin', status: 'pending', date: '2026-02-24', time: '10:00 AM' },
  { id: '15', hook: 'Newsletter: February market wrap + tax tips', channel: 'email', status: 'pending', date: '2026-02-25', time: '7:30 AM' },
  { id: '16', hook: 'Why your best clients leave (and how to stop it)', channel: 'threads', status: 'pending', date: '2026-02-26', time: '11:00 AM' },
  { id: '17', hook: 'Draft: Upcoming webinar announcement', channel: 'linkedin', status: 'draft', date: '2026-02-27', time: '9:00 AM' },
  { id: '18', hook: 'Draft: Q3 advisory services launch', channel: 'email', status: 'draft', date: '2026-02-28', time: '7:30 AM' },
];

export const samplePostBody = `The ATO's new SMSF reporting requirements have been a hot topic among trustees and advisors alike. But here's what most people are missing — these changes are actually designed to simplify compliance, not complicate it.

Here are three things every SMSF trustee should understand:

1. **Transfer Balance Cap reporting is now streamlined.** The new digital reporting framework reduces manual data entry and catches errors earlier in the process.

2. **Event-based reporting thresholds have been clarified.** If your fund's balance is below $5M, the reporting requirements are actually lighter than before.

3. **The ATO is investing in better guidance materials.** Expect clearer documentation and more accessible support for trustees who self-manage.

The bottom line? If you've been worried about increased compliance burden, take a breath. Work with your advisor to understand what's actually changed — you might be pleasantly surprised.

#SMSF #Accounting #TaxPlanning #FinancialServices`;

export const ideaItems: Idea[] = [
  { id: 'i1', hook: 'Why the ATO\'s new SMSF reporting rules are actually good news for your clients', angle: 'Educational', channel: 'linkedin', relevance: 9, talkingPoints: ['New digital reporting framework overview', 'Impact on sub-$5M funds', 'How to prepare clients for the transition'] },
  { id: 'i2', hook: 'The one conversation every accountant avoids (and why it costs you referrals)', angle: 'Opinion', channel: 'linkedin+threads', relevance: 8, talkingPoints: ['The advisory vs compliance mindset shift', 'How proactive conversations build trust', 'Real examples of missed opportunities'] },
  { id: 'i3', hook: 'End of financial year checklist: what your clients should be doing right now', angle: 'Educational', channel: 'email', relevance: 10, talkingPoints: ['Top 10 EOFY actions for SMEs', 'Common mistakes to avoid', 'Deadline reminders and key dates'] },
  { id: 'i4', hook: '3 things I wish I knew before advising my first SMSF trustee', angle: 'Story', channel: 'linkedin', relevance: 7, talkingPoints: ['Personal anecdote about early career', 'Lessons on client communication', 'How the industry has evolved'] },
  { id: 'i5', hook: 'What the RBA\'s decision this week means for your clients\' cash flow', angle: 'Trending', channel: 'linkedin+threads', relevance: 9, talkingPoints: ['Rate decision summary', 'Practical impact on business clients', 'Talking points for client conversations'] },
  { id: 'i6', hook: 'We helped a client save $40K in tax last year. Here\'s what we did differently.', angle: 'Case Study', channel: 'linkedin', relevance: 9, talkingPoints: ['The client\'s situation before', 'Strategy used (without giving away specifics)', 'The outcome and ongoing relationship'] },
  { id: 'i7', hook: 'The myth of the \'set and forget\' investment portfolio', angle: 'Opinion', channel: 'threads', relevance: 7, talkingPoints: ['Why passive isn\'t always passive', 'Market conditions that demand review', 'How advisors add value'] },
  { id: 'i8', hook: 'Trust distributions explained in plain English (finally)', angle: 'Educational', channel: 'linkedin', relevance: 8, talkingPoints: ['What distributions actually mean', 'Common structures explained simply', 'Tax implications overview'] },
  { id: 'i9', hook: 'Why I think every accounting firm should post on LinkedIn (and most don\'t)', angle: 'Opinion', channel: 'linkedin', relevance: 6, talkingPoints: ['The visibility gap in professional services', 'ROI of consistent content', 'Overcoming the "we\'re too boring" mindset'] },
  { id: 'i10', hook: 'Fringe benefits tax season: what\'s changed and what hasn\'t', angle: 'Educational', channel: 'email', relevance: 8, talkingPoints: ['Key FBT changes for 2026', 'Common employer mistakes', 'Checklist for clients'] },
  { id: 'i11', hook: 'How to talk to your clients about succession planning without scaring them', angle: 'Educational', channel: 'linkedin', relevance: 7, talkingPoints: ['Framing the conversation positively', 'Key questions to ask', 'Common barriers and how to overcome them'] },
  { id: 'i12', hook: 'The accounting industry\'s biggest opportunity in 2026 isn\'t AI — it\'s advisory', angle: 'Opinion', channel: 'linkedin+threads', relevance: 8, talkingPoints: ['Why advisory revenue is growing', 'How to position your firm', 'Examples of advisory-first firms'] },
  { id: 'i13', hook: '5 tax deductions your small business clients are probably missing', angle: 'Educational', channel: 'threads', relevance: 9, talkingPoints: ['Home office deductions', 'Asset write-offs', 'Superannuation strategies'] },
  { id: 'i14', hook: 'Behind the scenes: what a week at our firm actually looks like', angle: 'Story', channel: 'linkedin', relevance: 5, talkingPoints: ['Daily routine overview', 'Client interaction highlights', 'Team culture moments'] },
  { id: 'i15', hook: 'The $100K mistake I see business owners make every single year', angle: 'Case Study', channel: 'linkedin+threads', relevance: 8, talkingPoints: ['The common mistake explained', 'Real cost breakdown', 'Simple fix overview'] },
];

export const impressionsData = Array.from({ length: 21 }, (_, i) => {
  const day = i + 1;
  const isPostDay = [2, 3, 5, 7, 10, 11, 14, 17, 19, 21].includes(day);
  return {
    date: `Feb ${day}`,
    impressions: isPostDay ? 800 + Math.floor(Math.random() * 1200) : 200 + Math.floor(Math.random() * 400),
    engagements: isPostDay ? 40 + Math.floor(Math.random() * 80) : 10 + Math.floor(Math.random() * 30),
  };
});

export const followerData = [
  { month: 'Dec 1', followers: 310 },
  { month: 'Dec 15', followers: 315 },
  { month: 'Jan 1', followers: 318, annotation: 'Phlo started →' },
  { month: 'Jan 15', followers: 335 },
  { month: 'Feb 1', followers: 358 },
  { month: 'Feb 15', followers: 375 },
  { month: 'Feb 21', followers: 387 },
];
