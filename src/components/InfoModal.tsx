import { memo, useEffect } from 'react'
import { Brick } from '../types'
import './InfoModal.css'

interface InfoModalProps {
  brick: Brick
  onClose: () => void
}

function InfoModal({ brick, onClose }: InfoModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-content ${brick.content.title === 'Experience' ? 'experience-modal' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{brick.content.title}</h2>
          <button className="close-button" onClick={onClose}>X</button>
        </div>

        <div className="modal-body">
          <p className="modal-description">{brick.content.description}</p>

          {brick.content.title === 'Contact' ? (
            <div className="contact-buttons">
              {brick.content.items?.map((item, index) => {
                const parts = item.split(': ');
                const type = parts[0];
                const value = parts[1];

                let iconClass = '';
                let href = '';
                let label = '';

                if (type === 'Email') {
                  iconClass = 'hn hn-envelope-solid';
                  href = `mailto:${value}`;
                  label = 'Email';
                } else if (type === 'GitHub') {
                  iconClass = 'hn hn-github';
                  href = value;
                  label = 'GitHub';
                } else if (type === 'LinkedIn') {
                  iconClass = 'hn hn-linkedin';
                  href = value;
                  label = 'LinkedIn';
                } else if (type === 'Discord') {
                  iconClass = 'hn hn-discord';
                  href = value;
                  label = 'Discord';
                } else {
                  return null;
                }

                return (
                  <a
                    key={index}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="contact-button"
                  >
                    <i className={`${iconClass} contact-icon`}></i>
                    <span className="contact-label">{label}</span>
                  </a>
                );
              })}
            </div>
          ) : brick.content.title === 'Projects' ? (
            brick.content.items && (
              <ul className="modal-list">
                {brick.content.items.map((item, index) => {
                  const lines = item.split('\n');
                  const projectName = lines[0];
                  const description = lines[1];
                  const githubLine = lines[2];
                  const githubUrl = githubLine ? githubLine.replace('GitHub: ', '') : '';

                  return (
                    <li key={index} className="project-item">
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
                          {projectName}
                        </div>
                        <div style={{ fontSize: '16px', marginBottom: '12px' }}>
                          {description}
                        </div>
                        {githubUrl && (
                          <a
                            href={githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="github-link"
                          >
                            <i className="hn hn-github"></i>
                            <span>View on GitHub</span>
                          </a>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )
          ) : (
            brick.content.items && (
              <ul className="modal-list">
                {brick.content.items.map((item, index) => (
                  <li key={index} className={brick.content.title === 'Experience' ? 'experience-item' : ''}>
                    {item.split('\n').map((line, lineIndex) => {
                      const parts = line.split('||');
                      const mainText = parts[0];
                      const rightText = parts[1];
                      const showStar = brick.content.title === 'Experience' && lineIndex > 0;

                      return (
                        <div
                          key={lineIndex}
                          className={brick.content.title === 'Experience' ? 'experience-line' : ''}
                          style={{
                            fontStyle: (line.includes('M.S.') || line.includes('B.S.')) ? 'italic' : 'normal',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            marginBottom: lineIndex < item.split('\n').length - 1 ? '8px' : '0',
                            position: 'relative',
                            paddingLeft: showStar ? '24px' : '0',
                            width: '100%',
                            fontSize: lineIndex === 0 ? '18px' : '16px'
                          }}
                        >
                          {showStar && (
                            <span className="bullet-star"></span>
                          )}
                          <span className="experience-main-text" style={{ flex: rightText ? 1 : 'none', wordWrap: 'break-word', overflowWrap: 'break-word', minWidth: 0 }}>{mainText}</span>
                          {rightText && <span className="experience-right-text" style={{ flexShrink: 0, marginLeft: '10px', whiteSpace: 'nowrap' }}>{rightText}</span>}
                        </div>
                      );
                    })}
                  </li>
                ))}
              </ul>
            )
          )}
        </div>

        <div className="modal-footer">
          <p className="hint desktop-hint">Press ESC or click outside to close</p>
          <p className="hint mobile-hint">Tap outside or close button to exit</p>
        </div>
      </div>
    </div>
  )
}

export default memo(InfoModal)
