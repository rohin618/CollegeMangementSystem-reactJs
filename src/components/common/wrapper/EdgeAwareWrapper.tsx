import { usePopper } from 'react-popper';
import {
  useState,
  cloneElement,
  ReactElement,
  useEffect,
  useRef,
} from 'react';
import Portal from '../../../layout/Portal/Portal';

interface EdgeWrapperProps {
  children: ReactElement;  // trigger
  content: ReactElement;   // card
}

const EdgeAwareWrapper = ({ children, content }: EdgeWrapperProps) => {
  const [referenceEl, setReferenceEl] = useState<HTMLElement | null>(null);
  const [popperEl, setPopperEl] = useState<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);

  const popperRef = useRef<HTMLDivElement | null>(null);

  const close = () => setOpen(false);

  const { styles, attributes } = usePopper(referenceEl, popperEl, {
    placement: 'right',
    modifiers: [
      { name: 'offset', options: { offset: [0, 8] } },
      {
        name: 'flip',
        options: {
          fallbackPlacements: ['right', 'left', 'bottom', 'top'],
        },
      },
      { name: 'preventOverflow', options: { padding: 8 } },
    ],
  });

  // 🔒 close on outside click
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        popperRef.current &&
        !popperRef.current.contains(e.target as Node) &&
        referenceEl &&
        !referenceEl.contains(e.target as Node)
      ) {
        close();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, referenceEl]);

  // ⌨️ close on ESC
  useEffect(() => {
    if (!open) return;

    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };

    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [open]);

  return (
    <>
      {cloneElement(children, {
        ref: setReferenceEl,
        onClick: () => setOpen((v) => !v),
      })}

      {open && (
        <Portal>
          <div
            ref={(el) => {
              setPopperEl(el);
              popperRef.current = el;
            }}
            style={styles.popper}
            {...attributes.popper}
          >
            {/* inject close handler into content */}
            {cloneElement(content, { onClose: close })}
          </div>
        </Portal>
      )}
    </>
  );
};

export default EdgeAwareWrapper;
