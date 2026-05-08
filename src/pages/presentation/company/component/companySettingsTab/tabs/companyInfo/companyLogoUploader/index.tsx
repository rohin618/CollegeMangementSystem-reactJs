import { updateCompanyLogo } from "../../../../../../../../common/api/company";
import USERS from "../../../../../../../../common/data/userDummyData";
import Avatar from "../../../../../../../../components/Avatar";
import { Card, CardBody, Input } from "../../../../../../../../components/bootstrap";


export const CompanyLogoUploader = ({ companyName = '', fileName = '', onUpdateLogo = () => { },logoUrl='' }: any) => {
    // const [logoUrl, setLogoUrl] = useState<string>('');

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = await updateCompanyLogo(file, fileName);
            onUpdateLogo(url)
            // Create a temporary URL for preview
            // const objectUrl = URL.createObjectURL(file);

        }
    };



    return (
        <Card>
            <CardBody>
                <div className="col-12">
                    <div className="row g-4 align-items-center">
                        <div className="col-lg-auto">
                            <Avatar
                                src={logoUrl} // fallback if no logo selected
                                color={USERS.JOHN.color}
                                rounded={3}
                                userName={companyName}
                            />
                        </div>
                        <div className="col-lg">
                            <div className="row g-4">
                                <div className="col-auto">
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        ariaLabel="Upload image file"
                                    />
                                </div>
                                <div className="col-12">
                                    <p className="text-muted">
                                        Upload your company logo to personalize your profile.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </CardBody>
        </Card>
    );
};




// CompanyLogoUploader