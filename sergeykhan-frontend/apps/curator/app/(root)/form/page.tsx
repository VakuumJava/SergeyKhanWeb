"use client"

import React from 'react';
import { FormProvider, useForm } from "react-hook-form";
import {AccountFormComponent} from "@shared/forms/formsComponent/formComponent";

const Page = () => {
    const methods = useForm();
    return (
        <div className="flex flex-col">

            <FormProvider {...methods}>
                <AccountFormComponent />
            </FormProvider>
        </div>

    );
};

export default Page;
