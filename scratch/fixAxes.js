import fs from 'fs';
import path from 'path';

const healthPath = path.join(process.cwd(), 'src', 'pages', 'dashboard', 'HealthDashboard.tsx');
let content = fs.readFileSync(healthPath, 'utf8');

// 1. Add isMobile state
if (!content.includes('const [isMobile')) {
  content = content.replace(
    /const \[timeRange, setTimeRange\] = useState<'week' \| 'month'>\('week'\);/,
    `const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');\n  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);\n  useEffect(() => {\n    const handleResize = () => setIsMobile(window.innerWidth < 768);\n    window.addEventListener('resize', handleResize);\n    return () => window.removeEventListener('resize', handleResize);\n  }, []);`
  );
}

// 2. Update YAxis in static chart
content = content.replace(
  /<YAxis\s+domain=\{\[0, 100\]\}\s+axisLine=\{false\}\s+tickLine=\{false\}\s+tick=\{\{ fill: theme === 'light' \? '#5a6478' : '#9ca3b8', fontSize: 10, fontWeight: 600 \}\}/,
  `<YAxis
                          domain={[0, 100]}
                          axisLine={{ stroke: theme === 'light' ? '#64748b' : '#475569', strokeWidth: 1.5 }}
                          tickLine={false}
                          tick={{ fill: theme === 'light' ? '#334155' : '#e2e8f0', fontSize: 10, fontWeight: 700 }}`
);

// 3. Update XAxis in main chart
content = content.replace(
  /<XAxis\s+dataKey="day"\s+axisLine=\{false\}\s+tickLine=\{false\}\s+tick=\{\{ fill: '#9ca3b8', fontSize: 9, fontWeight: 600, angle: -45, textAnchor: 'end' \}\}/,
  `<XAxis
                              dataKey="day"
                              axisLine={{ stroke: theme === 'light' ? '#64748b' : '#475569', strokeWidth: 1.5 }}
                              tickLine={false}
                              tick={{ fill: theme === 'light' ? '#334155' : '#e2e8f0', fontSize: 9, fontWeight: 700, ...(isMobile ? { angle: -45, textAnchor: 'end' } : {}) }}`
);

fs.writeFileSync(healthPath, content, 'utf8');
console.log('Fixed axis styling.');
