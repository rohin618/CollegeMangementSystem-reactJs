import USERS from "../../../../../../../common/data/userDummyData";
import Avatar from "../../../../../../../components/Avatar";
import { Card, CardBody, Input } from "../../../../../../../components/bootstrap";


export const AvatarSection = () => (
    <Card>
        <CardBody>
            <div className='col-12'>
                <div className='row g-4 align-items-center'>
                    <div className='col-lg-auto'>
                        <Avatar
                            srcSet={USERS.JOHN.srcSet}
                            src={USERS.JOHN.src}
                            color={USERS.JOHN.color}
                            rounded={3}
                        />
                    </div>
                    <div className='col-lg'>
                        <div className='row g-4'>
                            <div className='col-auto'>
                                <Input
                                    type='file'
                                    autoComplete='photo'
                                    ariaLabel='Upload image file'
                                />
                            </div>
                            <div className='col-12'>
                                <p className='text-muted'>
                                    Avatar helps your teammates get to know you.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </CardBody>
    </Card>
);