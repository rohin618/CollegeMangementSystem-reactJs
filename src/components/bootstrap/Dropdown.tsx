import React, {
	cloneElement,
	createContext,
	ElementType,
	FC,
	forwardRef,
	HTMLAttributes,
	JSXElementConstructor,
	ReactElement,
	ReactNode,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from 'react';
import ReactDOM from 'react-dom';
import { Manager, Popper, Reference } from 'react-popper';
import classNames from 'classnames';
// @ts-ignore
import useEventOutside from '@omtanke/react-use-event-outside';
import useDarkMode from '../../hooks/useDarkMode';

import { IButtonProps } from './Button';
import { TDropdownDirection } from '../../type/dropdown-type';

interface IDropdownContextValue {
	referenceEl: HTMLElement | null;
	setReferenceEl: (el: HTMLElement | null) => void;
}
const DropdownContext = createContext<IDropdownContextValue>({
	referenceEl: null,
	setReferenceEl: () => {},
});

interface IDropdownToggleProps {
	children: ReactElement<IButtonProps> | ReactNode;
	isOpen?: boolean;
	setIsOpen?: (value: ((prevState: boolean) => boolean) | boolean | null) => void | null;
	hasIcon?: boolean;
}
export const DropdownToggle: FC<IDropdownToggleProps> = ({
	children,
	isOpen,
	setIsOpen = () => {},
	hasIcon = true,
}) => {
	const dropdownButtonRef = useRef<HTMLElement | null>(null);
	const { setReferenceEl } = useContext(DropdownContext);

	const setButtonRef = useCallback(
		(node: HTMLElement | null, ref: (arg0: any) => any) => {
			dropdownButtonRef.current = node;
			setReferenceEl(node);
			return ref(node);
		},
		[setReferenceEl],
	);

	return (
		<Reference>
			{({ ref }) =>
				cloneElement(
					// @ts-ignore
					children.props.isButtonGroup ? (
						<span className='visually-hidden'>Toggle Dropdown</span>
					) : (
						children
					),
					{
						// @ts-ignore
						ref: (node: HTMLElement | null) => setButtonRef(node, ref),
						onClick: () => {
							// @ts-ignore
							// eslint-disable-next-line @typescript-eslint/no-unused-expressions
							children?.props?.onClick ? children.props.onClick() : null;
							if (setIsOpen) {
								setIsOpen(!isOpen);
							}
						},
						className: classNames(
							{
								'dropdown-toggle': hasIcon,
								// @ts-ignore
								'dropdown-toggle-split': children.props.isButtonGroup,
								show: isOpen,
							},
							// @ts-ignore
							children?.props?.className,
						),
						'aria-expanded': isOpen,
					},
				)
			}
		</Reference>
	);
};
DropdownToggle.displayName = 'DropdownToggle';

interface IDropdownMenuProps extends HTMLAttributes<HTMLUListElement> {
	isOpen?: boolean;
	setIsOpen?: (value: ((prevState: boolean) => boolean) | boolean | null) => void | null;
	children:
		| ReactElement<IDropdownItemProps>
		| ReactElement<IDropdownItemProps>[]
		| ReactNode
		| ReactNode[];
	className?: string;
	isAlignmentEnd?: boolean;
	breakpoint?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | null;
	size?: 'sm' | 'md' | 'lg' | null;
	direction?: string | null;
	isCloseAfterLeave?: boolean;
}
export const DropdownMenu: FC<IDropdownMenuProps> = ({
	isOpen,
	setIsOpen = () => {},
	children,
	className,
	isAlignmentEnd,
	breakpoint,
	size,
	direction,
	isCloseAfterLeave = true,
	...props
}) => {
	const dropdownListRef = useRef(null);
	const { referenceEl } = useContext(DropdownContext);
	const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

	const setListRef = useCallback((node: null, ref: (arg0: any) => any) => {
		dropdownListRef.current = node;
		return ref(node);
	}, []);

	const yAxis =
		(direction === 'up' && 'top') ||
		(direction === 'end' && 'right') ||
		(direction === 'start' && 'left') ||
		'bottom';

	const xAxis = isAlignmentEnd ? 'end' : 'start';

	const { darkModeStatus } = useDarkMode();

	// Calculate position from the reference element using fixed positioning
	useEffect(() => {
		if (!isOpen || !referenceEl) return;

		const updatePosition = () => {
			const rect = referenceEl.getBoundingClientRect();
			const menuEl = dropdownListRef.current as HTMLElement | null;
			const menuWidth = menuEl ? menuEl.offsetWidth : 150;
			const menuHeight = menuEl ? menuEl.offsetHeight : 100;
			const vw = window.innerWidth;
			const vh = window.innerHeight;

			// Default: open below, aligned to end (right edge of button)
			let top = rect.bottom + 4;
			let left = isAlignmentEnd ? rect.right - menuWidth : rect.left;

			// Flip up if not enough space below
			if (rect.bottom + menuHeight > vh) {
				top = rect.top - menuHeight - 4;
			}
			// Ensure top is never above viewport
			if (top < 4) top = 4;

			// Clamp horizontally so menu never goes off-screen
			if (left + menuWidth > vw - 4) {
				left = vw - menuWidth - 4;
			}
			if (left < 4) left = 4;

			setMenuStyle({
				position: 'fixed',
				top,
				left,
				zIndex: 9999,
			});
		};

		updatePosition();

		window.addEventListener('scroll', updatePosition, true);
		window.addEventListener('resize', updatePosition);
		return () => {
			window.removeEventListener('scroll', updatePosition, true);
			window.removeEventListener('resize', updatePosition);
		};
	}, [isOpen, referenceEl, isAlignmentEnd]);

	if (isOpen) {
		// Use portal + fixed positioning when inside a scrollable/overflow container
		if (referenceEl) {
			return ReactDOM.createPortal(
				<ul
					role='presentation'
					ref={dropdownListRef}
					style={menuStyle}
					className={classNames(
						'dropdown-menu',
						'show',
						{ 'dropdown-menu-dark': darkModeStatus },
						{
							[`dropdown-menu-${size}`]: size,
						},
						className,
					)}
					onMouseLeave={
						isCloseAfterLeave && setIsOpen ? () => setIsOpen(false) : undefined
					}
					{...props}>
					{children}
				</ul>,
				document.body,
			);
		}

		// Fallback: original Popper-based rendering
		return (
			<Popper
				placement={breakpoint ? 'bottom-start' : `${yAxis}-${xAxis}`}
				modifiers={[
					{
						name: 'flip',
						options: {
							fallbackPlacements: [`top-${xAxis}`, `bottom-${xAxis}`],
						},
					},
				]}>
				{({ ref, style, placement }) => (
					<ul
						role='presentation'
						// @ts-ignore
						ref={(node) => setListRef(node, ref)}
						style={!breakpoint ? style : undefined}
						data-placement={placement}
						className={classNames(
							'dropdown-menu',
							'show',
							{ 'dropdown-menu-dark': darkModeStatus },
							{
								[`dropdown-menu-${size}`]: size,
								'dropdown-menu-end': !isAlignmentEnd && breakpoint,
								[`dropdown-menu${breakpoint ? `-${breakpoint}` : ''}-${
									isAlignmentEnd ? 'end' : 'start'
								}`]: isAlignmentEnd || breakpoint,
							},
							className,
						)}
						data-bs-popper={breakpoint ? 'static' : null}
						onMouseLeave={
							isCloseAfterLeave && setIsOpen ? () => setIsOpen(false) : undefined
						}
						{...props}>
						{children}
					</ul>
				)}
			</Popper>
		);
	}
	return null;
};
DropdownMenu.displayName = 'DropdownMenu';

interface IItemWrapperProps {
	children: ReactNode;
	className?: string;
}
const ItemWrapper = forwardRef<HTMLLIElement, IItemWrapperProps>(
	({ children, className, ...props }, ref) => {
		return (
			<li ref={ref} className={classNames('dropdown-item-wrapper', className)} {...props}>
				{children}
			</li>
		);
	},
);
ItemWrapper.displayName = 'ItemWrapper';

interface IDropdownItemProps extends HTMLAttributes<HTMLLIElement> {
	children?: ReactElement<any, string | JSXElementConstructor<any>> | string;
	isHeader?: boolean;
	isDivider?: boolean;
	isText?: boolean;
}
export const DropdownItem = forwardRef<HTMLLIElement, IDropdownItemProps>(
	({ children, isHeader, isDivider, isText, ...props }, ref) => {
		if (isHeader) {
			return (
				// eslint-disable-next-line react/jsx-props-no-spreading
				<ItemWrapper ref={ref} {...props}>
					{cloneElement(
						// @ts-ignore
						typeof children === 'string' ? <h6>{children}</h6> : children,
						{
							// @ts-ignore
							className: classNames('dropdown-header', children?.props?.className),
						},
					)}
				</ItemWrapper>
			);
		}
		if (isDivider) {
			return (
				// eslint-disable-next-line react/jsx-props-no-spreading
				<ItemWrapper ref={ref} {...props}>
					{} {/* @ts-ignore */}
					<hr className={classNames('dropdown-divider', children?.props?.className)} />
				</ItemWrapper>
			);
		}
		if (isText) {
			return (
				// eslint-disable-next-line react/jsx-props-no-spreading
				<ItemWrapper ref={ref} {...props}>
					{cloneElement(
						// @ts-ignore
						typeof children === 'string' ? <div>{children}</div> : children,
						{
							className: classNames(
								'dropdown-item-text',
								'dropdown-item',
								'disabled',
								// @ts-ignore
								children?.props?.className,
							),
						},
					)}
				</ItemWrapper>
			);
		}
		return (
			// eslint-disable-next-line react/jsx-props-no-spreading
			<ItemWrapper ref={ref} {...props}>
				{cloneElement(
					// @ts-ignore
					typeof children === 'string' ? <span>{children}</span> : children,
					{
						// @ts-ignore
						className: classNames('dropdown-item', children?.props?.className),
					},
				)}
			</ItemWrapper>
		);
	},
);
DropdownItem.displayName = 'DropdownItem';

export interface IDropdownProps {
	tag?: ElementType;
	children: ReactElement<IDropdownToggleProps>[] | ReactElement<IDropdownMenuProps>[];
	isOpen?: boolean | null;
	setIsOpen?(...args: unknown[]): unknown;
	direction?: TDropdownDirection;
	isButtonGroup?: boolean;
	className?: string;
}
const Dropdown: FC<IDropdownProps> = ({
	tag: Tag = 'div',
	children,
	isOpen,
	setIsOpen,
	direction = 'down',
	isButtonGroup,
	className,
}) => {
	const [state, setState] = useState(isOpen !== null && !!setIsOpen ? isOpen : false);
	const [referenceEl, setReferenceEl] = useState<HTMLElement | null>(null);

	const dropdownRef = useRef(null);

	const closeMenu = useCallback(() => {
		if (isOpen !== null && !!setIsOpen) {
			setIsOpen(false);
		} else {
			setState(false);
		}
	}, [isOpen, setIsOpen]);

	// Close when clicking outside — but only if click is NOT inside the portal menu
	const handleOutsideClick = useCallback(
		(e: MouseEvent | TouchEvent) => {
			if (!e?.target) return;
			const target = e.target as Node;
			// Check if click is inside a portal dropdown-menu in the body
			const portalMenus = document.querySelectorAll('body > .dropdown-menu');
			for (let i = 0; i < portalMenus.length; i++) {
				if (portalMenus[i].contains(target)) return;
			}
			closeMenu();
		},
		[closeMenu],
	);

	useEventOutside(dropdownRef, 'mousedown', handleOutsideClick);
	useEventOutside(dropdownRef, 'touchstart', handleOutsideClick);

	return (
		<DropdownContext.Provider value={{ referenceEl, setReferenceEl }}>
			<Manager>
				{/* @ts-ignore */}
				<Tag
					ref={dropdownRef}
					className={classNames(
						{
							[`drop${direction}`]: direction && !isButtonGroup,
							'btn-group': isButtonGroup,
						},
						className,
					)}>
					{/* @ts-ignore */}
					{children.map((child: ReactElement, index: any) =>
						// @ts-ignore
						['DropdownMenu', 'DropdownToggle'].includes(child.type.displayName)
							? cloneElement(child, {
									isOpen: isOpen !== null && !!setIsOpen ? isOpen : state,
									setIsOpen: isOpen !== null && !!setIsOpen ? setIsOpen : setState,
									direction,
									key: index,
								})
							: child,
					)}
				</Tag>
			</Manager>
		</DropdownContext.Provider>
	);
};
Dropdown.displayName = 'Dropdown';

export default Dropdown;
