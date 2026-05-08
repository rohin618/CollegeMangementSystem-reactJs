import React, { ElementType, forwardRef, HTMLAttributes, ReactNode } from 'react';

interface ITagWrapper extends Record<string, any>, HTMLAttributes<HTMLElement> {
	children: ReactNode;
	tag: ElementType;
	isLoading?: boolean;
}
const TagWrapper = forwardRef<HTMLDivElement | HTMLAnchorElement | HTMLFormElement, ITagWrapper>(
	({ tag: Tag = 'div', children, isLoading =false,...props }, ref) => {
		return (
			// eslint-disable-next-line react/jsx-props-no-spreading
			<Tag ref={ref} {...props}>
				{isLoading?'Loading..':children}
			</Tag>
		);
	},
);
TagWrapper.displayName = 'TagWrapper';

export default TagWrapper;
