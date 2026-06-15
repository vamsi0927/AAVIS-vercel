const fs = require('fs');
const path = require('path');

const healthPath = path.join(__dirname, '..', 'src', 'pages', 'dashboard', 'HealthDashboard.tsx');
let health = fs.readFileSync(healthPath, 'utf8');

health = health.replace(
  '<div className="flex items-start justify-between gap-3">',
  '<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">'
);
health = health.replace(
  '<div className="flex items-center gap-2 flex-shrink-0">',
  '<div className="flex flex-wrap items-center gap-2 flex-shrink-0">'
);
fs.writeFileSync(healthPath, health);

const historyPath = path.join(__dirname, '..', 'src', 'pages', 'History.tsx');
let history = fs.readFileSync(historyPath, 'utf8');

history = history.replace(
  '<h4 className="font-semibold text-content-primary truncate">',
  '<h4 className="font-semibold text-content-primary line-clamp-2 pr-2">'
);
history = history.replace(
  '<p className="text-xs text-content-secondary truncate mb-1">',
  '<p className="text-xs text-content-secondary line-clamp-2 mb-1 pr-2">'
);
fs.writeFileSync(historyPath, history);

console.log("Layouts fixed.");
