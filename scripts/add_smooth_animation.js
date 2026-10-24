const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'src', 'pages', 'AdminDashboard.tsx');
let code = fs.readFileSync(targetFile, 'utf8');

const marker = '{/* Hub Items */}';
const startIdx = code.indexOf(marker);
if (startIdx === -1) {
  console.error('Could not find marker:', marker);
  process.exit(1);
}

// Find the end of the items block (right before `</div>\n                );`)
const closingBlockMarker = '</div>\r\n                );\r\n              })}';
const closingBlockMarkerUnix = '</div>\n                );\n              })}';
let endIdx = code.indexOf(closingBlockMarker, startIdx);
let markerLen = closingBlockMarker.length;
if (endIdx === -1) {
  endIdx = code.indexOf(closingBlockMarkerUnix, startIdx);
  markerLen = closingBlockMarkerUnix.length;
}

if (endIdx === -1) {
  console.error('Could not find end of items block');
  process.exit(1);
}

const newItemsAnimatedJsx = `{/* Hub Items with Soft Accordion Slide & Fade Animation */}
                    <div
                      className={\`grid transition-[grid-template-rows,opacity] duration-300 ease-out \${
                        isExpanded
                          ? 'grid-rows-[1fr] opacity-100'
                          : 'grid-rows-[0fr] opacity-0 pointer-events-none'
                      }\`}
                    >
                      <div className="overflow-hidden space-y-0.5 pl-1.5 pt-0.5">
                        {hub.items.map((item) => {
                          const isActive = activeModule === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              data-module={item.id}
                              onClick={() => handleSelectModule(item.id)}
                              className={\`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 \${
                                isActive
                                  ? 'bg-[#F15A24] text-white font-bold shadow-md shadow-[#F15A24]/20'
                                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                              }\`}
                            >
                              <div className="flex items-center gap-2.5 truncate">
                                {item.icon}
                                <span className="truncate">{item.label}</span>
                              </div>
                              {item.badge && (
                                <span
                                  className={\`px-1.5 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 \${
                                    isActive
                                      ? 'bg-white/20 text-white'
                                      : (item.badgeColor || 'bg-slate-800 text-slate-300')
                                  }\`}
                                >
                                  {item.badge}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>`;

code = code.slice(0, startIdx) + newItemsAnimatedJsx + code.slice(endIdx);

// Also make the ChevronDown rotation duration match 300ms ease-out
code = code.replace('duration-200', 'duration-300 ease-out');

fs.writeFileSync(targetFile, code, 'utf8');
console.log('Successfully added soft opening and closing accordion animation!');
