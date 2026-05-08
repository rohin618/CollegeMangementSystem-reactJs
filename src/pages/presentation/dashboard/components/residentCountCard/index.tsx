import { useNavigate } from "react-router-dom";
import { PREBOOK_TYPE } from "../../../../../common/constant";
import { getColorNameWithIndex } from "../../../../../common/data/enumColors";
import USERS from "../../../../../common/data/userDummyData";
import Avatar, { AvatarGroup } from "../../../../../components/Avatar"
import { Button, Card, CardActions, CardBody, CardHeader, CardLabel, CardSubTitle, CardTitle } from "../../../../../components/bootstrap"
import useDarkMode from "../../../../../hooks/useDarkMode";


export const ResidentCountCard = ({ title = '', count = 0, residentList = [],status = '' }: any) => {
    const { darkModeStatus } = useDarkMode();

    const navigate = useNavigate()
    const handleResidentNavigation = () =>{
        status ? navigate(`/resident?status=${status}`) : navigate('/resident');
    }

    return (
        <Card>
            <CardHeader className='bg-transparent'>
                <CardLabel>
                    <CardTitle tag='div' className='h5'>
                        {title}
                    </CardTitle>
                    <CardSubTitle tag='div' className='h6 text-muted'>
                        From The January 2026
                    </CardSubTitle>
                </CardLabel>
                <CardActions>
                    <Button
                        icon='ArrowForwardIos'
                        aria-label='Read More'
                        hoverShadow='default'
                        color={darkModeStatus ? 'dark' : undefined}
                        onClick={handleResidentNavigation}
                    />
                </CardActions>
            </CardHeader>
            <CardBody>
                <div className="d-flex justify-content-between align-items-center">
                    <span className="fw-bold  mb-3" style={{ fontSize: 50 }}> {count}</span>
                    <AvatarGroup size={40}>
                        {residentList.map((resident: any, index: number) => (
                            <Avatar
                                key={resident.id}
                                userName={resident.personal?.name}
                                color={getColorNameWithIndex(index)}
                                size={40}
                            />
                        ))}
                    </AvatarGroup>
                    

                </div>



            </CardBody>
        </Card>
    )
}