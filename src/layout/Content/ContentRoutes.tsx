import React, { lazy } from "react";
import { Route, Routes } from "react-router-dom";
import contents from "../../routes/contentRoutes";
import PrivateRoute from "../../routes/privateRoute";

const PAGE_404 = lazy(() => import("../../pages/presentation/auth/Page404"));

const ContentRoutes = () => {
  return (
    <Routes>
      {contents.map(({ path, element, isPublic }) => (
        <Route
          key={path}
          path={path}
          element={
            isPublic ? (
              element
            ) : (
              <PrivateRoute>
                <React.Fragment key={path}>{element}</React.Fragment>
              </PrivateRoute>
            )
          }
        />
      ))}
      <Route path="*" element={<PAGE_404 />} />
    </Routes>
  );
};

export default ContentRoutes;



