import { Children, ReactNode } from "react";
import { ResidentProfileCard } from "../residentProfileCard";
import { getColorNameWithIndex } from "../../../common/data/enumColors";
import { Popovers } from "../../bootstrap";
import { IResidentModel } from "../../../common/interface";

interface Props {
    className?: string;
    children: ReactNode[];
    max?: number;
}

export const ResidentProfileGroup = ({
    className,
    children,
    max = 1
}: Props) => {
    if (!children) return null;



    const childArray = Children.toArray(children);
    const visible = childArray.slice(0, max);
    const hidden = childArray.slice(max);

    return (
        <>
            {/* 👤 Visible items */}
            {visible}

            {/* ➕ More */}
            {hidden.length > 0 && (
                <Popovers
                    trigger="hover"
                    desc={hidden.map((child: any, index) => (
                        child
                    ))}
                >
                    <span className="text-center">
                        <span className="cursor-pointer">
                            +{hidden.length}  more residents
                        </span>
                    </span>
                </Popovers>
            )}
        </>
    );
};
